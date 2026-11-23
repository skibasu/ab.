import { File, Paths } from 'expo-file-system';

import { withLibraryDatabase } from './library-database';

type TrackSnapshot = { id: string; filePath: string; size: number; modifiedAt: number };
type SavedTrack = Pick<TrackSnapshot, 'id' | 'filePath'>;

function snapshot(track: SavedTrack): TrackSnapshot | null {
  const file = new File(Paths.document, track.filePath);
  const modifiedAt = file.modificationTime;
  if (!file.exists || file.size <= 0 || modifiedAt === null) return null;
  return { ...track, size: file.size, modifiedAt };
}

/** A receipt is useful only while every recorded track still belongs to this account and exists. */
export function hasCompletedZip(
  userId: string,
  digest: string,
  zipBytes: number,
  assertActive: () => void,
): Promise<boolean> {
  return withLibraryDatabase(async (database) => {
    assertActive();
    const receipt = await database.getFirstAsync<{ tracksJson: string }>(
      'SELECT tracksJson FROM zip_import_receipts WHERE userId = ? AND digest = ? AND zipBytes = ?',
      userId,
      digest,
      zipBytes,
    );
    if (!receipt) return false;
    let recorded: TrackSnapshot[] = [];
    try {
      const value: unknown = JSON.parse(receipt.tracksJson);
      if (Array.isArray(value)) recorded = value;
    } catch {
      /* A malformed optimization record must never prevent normal import. */
    }
    const current = await database.getAllAsync<SavedTrack>(
      `SELECT tracks.id, tracks.filePath FROM tracks
       JOIN books ON books.id = tracks.bookId WHERE books.userId = ?`,
      userId,
    );
    const byId = new Map(current.map((track) => [track.id, track]));
    const valid =
      recorded.length > 0 &&
      recorded.every((track) => {
        if (!track || typeof track.id !== 'string' || typeof track.filePath !== 'string')
          return false;
        const saved = byId.get(track.id);
        if (saved?.filePath !== track.filePath) return false;
        const actual = snapshot(saved);
        return (
          actual !== null && actual.size === track.size && actual.modifiedAt === track.modifiedAt
        );
      });
    assertActive();
    if (!valid) {
      await database.runAsync(
        'DELETE FROM zip_import_receipts WHERE userId = ? AND digest = ?',
        userId,
        digest,
      );
    }
    assertActive();
    return valid;
  });
}

/** Record only imports for which metadata, comparisons and audio persistence all succeeded. */
export function rememberCompletedZip(
  userId: string,
  digest: string,
  zipBytes: number,
  bookIds: string[],
  assertActive: () => void,
): Promise<void> {
  return withLibraryDatabase((database) =>
    database.withTransactionAsync(async () => {
      assertActive();
      const recorded: TrackSnapshot[] = [];
      for (const bookId of new Set(bookIds)) {
        const tracks = await database.getAllAsync<SavedTrack>(
          `SELECT tracks.id, tracks.filePath FROM tracks JOIN books ON books.id = tracks.bookId
         WHERE books.userId = ? AND books.id = ?`,
          userId,
          bookId,
        );
        if (!tracks.length) return;
        for (const track of tracks) {
          const actual = snapshot(track);
          if (!actual) return;
          recorded.push(actual);
        }
      }
      if (!recorded.length) return;
      assertActive();
      await database.runAsync(
        `INSERT OR REPLACE INTO zip_import_receipts (userId, digest, zipBytes, tracksJson)
       VALUES (?, ?, ?, ?)`,
        userId,
        digest,
        zipBytes,
        JSON.stringify(recorded),
      );
      assertActive();
    }),
  );
}
