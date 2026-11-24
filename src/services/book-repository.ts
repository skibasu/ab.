import { withLibraryDatabase } from './library-database';
import type { SavedBookFiles } from './library-storage';
import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { stripPolishDiacritics } from '@/utils/strip-polish-diacritics';

export type LibraryBook = {
  id: string;
  userId: string;
  title: string;
  author: string;
  duration: number | null;
  coverPath: string;
  createdAt: number;
  lastPlayedAt: number | null;
  lastPlayedTrackId: string | null;
  percentProgress: number;
};

export type LibraryTrack = {
  id: string;
  title: string;
  filePath: string;
  duration: number | null;
  position: number;
  positionSeconds: number;
  completed: boolean;
  lastPlayedAt: number | null;
  updatedAt: number | null;
};

export type LibraryBookWithTracks = LibraryBook & { tracks: LibraryTrack[] };

export type BookPlaybackUpdate = Pick<
  LibraryBook,
  'lastPlayedAt' | 'lastPlayedTrackId' | 'percentProgress'
>;
export type TrackPlaybackUpdate = Pick<
  LibraryTrack,
  'positionSeconds' | 'completed' | 'lastPlayedAt' | 'updatedAt'
>;

export type PlaybackProgressInput = TrackPlaybackUpdate & {
  userId: string;
  bookId: string;
  trackId: string;
};

export type SavedPlaybackProgress = PlaybackProgressInput & {
  percentProgress: number;
};

type LibraryTrackRow = Omit<LibraryTrack, 'completed'> & { completed: 0 | 1 };

const toLibraryTrack = (row: LibraryTrackRow): LibraryTrack => ({
  ...row,
  completed: row.completed === 1,
});

const filenameOrder = new Intl.Collator(undefined, { numeric: true });

/** Stores successfully copied tracks and updates the book in one transaction. */
export async function saveBook(
  book: SavedBookFiles,
  append = false,
  assertActive?: () => void,
): Promise<void> {
  assertActive?.();
  if (book.files.length === 0) throw new Error(LIBRARY_ERROR_MESSAGES.emptyBook);

  const tracks = [...book.files]
    .sort(
      (first, second) =>
        (first.disk.no ?? 1) - (second.disk.no ?? 1) ||
        (first.track.no ?? Infinity) - (second.track.no ?? Infinity) ||
        filenameOrder.compare(
          stripPolishDiacritics(first.name),
          stripPolishDiacritics(second.name),
        ),
    )
    .map((file, position) => ({
      id: file.id,
      title: file.title?.trim() || file.name,
      filePath: file.relativePath,
      duration: file.duration ?? null,
      position,
    }));

  await withLibraryDatabase((database) =>
    database.withTransactionAsync(async () => {
      assertActive?.();
      let startPosition = 0;
      if (append) {
        const existing = await database.getFirstAsync<{ nextPosition: number }>(
          `SELECT COALESCE(MAX(tracks.position) + 1, 0) AS nextPosition
           FROM books LEFT JOIN tracks ON tracks.bookId = books.id
           WHERE books.id = ? AND books.userId = ?
           GROUP BY books.id`,
          book.bookId,
          book.userId,
        );
        if (!existing) throw new Error(LIBRARY_ERROR_MESSAGES.bookUnavailable);
        startPosition = existing.nextPosition;
      } else {
        await database.runAsync(
          `INSERT INTO books (id, userId, title, author, coverPath, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          book.bookId,
          book.userId,
          book.title,
          book.author,
          book.coverRelativePath?.trim() || DEFAULT_BOOK_COVER_PATH,
          Date.now(),
        );
      }

      for (const track of tracks) {
        assertActive?.();
        await database.runAsync(
          `INSERT INTO tracks (id, bookId, title, filePath, duration, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
          track.id,
          book.bookId,
          track.title,
          track.filePath,
          track.duration,
          startPosition + track.position,
        );
      }

      await database.runAsync(
        `UPDATE books SET duration = (
           SELECT CASE WHEN COUNT(duration) = COUNT(*) THEN SUM(duration) ELSE NULL END
           FROM tracks WHERE bookId = books.id
         ) WHERE id = ? AND userId = ?`,
        book.bookId,
        book.userId,
      );
      // A change of account during native writes rolls back the transaction and its copied audio.
      assertActive?.();
    }),
  );
}

export function listBooks(userId: string): Promise<LibraryBook[]> {
  return withLibraryDatabase((database) =>
    database.getAllAsync<LibraryBook>(
      'SELECT * FROM books WHERE userId = ? ORDER BY createdAt DESC, id',
      userId,
    ),
  );
}

/** Loads the user's books and ordered tracks in a single query. */
export function getBooks(userId: string): Promise<LibraryBookWithTracks[]> {
  return withLibraryDatabase(async (database) => {
    const rows = await database.getAllAsync<LibraryBook & { tracksJson: string }>(
      `SELECT books.*,
         (
           SELECT json_group_array(json_object(
             'id', id, 'title', title, 'filePath', filePath,
             'duration', duration, 'position', position,
             'positionSeconds', positionSeconds, 'completed', completed,
             'lastPlayedAt', lastPlayedAt, 'updatedAt', updatedAt
           ))
           FROM (
             SELECT id, title, filePath, duration, position,
               positionSeconds, completed, lastPlayedAt, updatedAt
             FROM tracks
             WHERE bookId = books.id
             ORDER BY position
           )
         ) AS tracksJson
       FROM books
       WHERE userId = ?
       ORDER BY createdAt DESC, id`,
      userId,
    );

    return rows.map(({ tracksJson, ...book }) => ({
      ...book,
      tracks: (JSON.parse(tracksJson) as LibraryTrackRow[]).map(toLibraryTrack),
    }));
  });
}

export function getBook(userId: string, bookId: string): Promise<LibraryBookWithTracks | null> {
  return withLibraryDatabase(async (database) => {
    const book = await database.getFirstAsync<LibraryBook>(
      'SELECT * FROM books WHERE userId = ? AND id = ?',
      userId,
      bookId,
    );
    if (!book) return null;

    const tracks = await database.getAllAsync<LibraryTrackRow>(
      `SELECT id, title, filePath, duration, position,
         positionSeconds, completed, lastPlayedAt, updatedAt
       FROM tracks WHERE bookId = ? ORDER BY position`,
      bookId,
    );
    return { ...book, tracks: tracks.map(toLibraryTrack) };
  });
}

export function updateBookAuthor(
  userId: string,
  bookId: string,
  author: string,
  assertActive?: () => void,
): Promise<void> {
  return withLibraryDatabase((database) =>
    database.withTransactionAsync(async () => {
      assertActive?.();
      await database.runAsync(
        'UPDATE books SET author = ? WHERE id = ? AND userId = ?',
        author,
        bookId,
        userId,
      );
      assertActive?.();
    }),
  );
}

function assertPlaybackTimestamp(value: number | null): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError(LIBRARY_ERROR_MESSAGES.invalidPlaybackTimestamp);
  }
}

/** Commits the track and book together; the percentage is calculated from persisted track state. */
export async function savePlaybackProgress(
  progress: PlaybackProgressInput,
  assertActive?: () => void,
): Promise<SavedPlaybackProgress | null> {
  const { userId, bookId, trackId, positionSeconds, lastPlayedAt, updatedAt } = progress;
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0) {
    throw new RangeError(LIBRARY_ERROR_MESSAGES.invalidPlaybackPosition);
  }
  assertPlaybackTimestamp(lastPlayedAt);
  assertPlaybackTimestamp(updatedAt);

  return withLibraryDatabase(async (database) => {
    let saved: SavedPlaybackProgress | null = null;
    await database.withTransactionAsync(async () => {
      assertActive?.();
      const track = await database.getFirstAsync<LibraryTrackRow>(
        `SELECT tracks.* FROM tracks JOIN books ON books.id = tracks.bookId
         WHERE tracks.id = ? AND tracks.bookId = ? AND books.userId = ?`,
        trackId,
        bookId,
        userId,
      );
      if (!track) return;
      // A replay does not clear an already completed track.
      const completed = track.completed === 1 || progress.completed;
      const position =
        track.duration !== null && track.duration > 0
          ? Math.min(positionSeconds, track.duration)
          : positionSeconds;
      await database.runAsync(
        'UPDATE tracks SET positionSeconds = ?, completed = ?, lastPlayedAt = ?, updatedAt = ? WHERE id = ?',
        position,
        completed ? 1 : 0,
        lastPlayedAt,
        updatedAt,
        trackId,
      );
      const totals = await database.getFirstAsync<{ percentProgress: number }>(
        `SELECT CASE WHEN COUNT(duration) = COUNT(*) AND SUM(duration) > 0 THEN
          100.0 * SUM(CASE WHEN completed = 1 THEN duration
            ELSE MIN(positionSeconds, duration) END) / SUM(duration)
         ELSE 100.0 * AVG(CASE WHEN completed = 1 THEN 1.0
            WHEN duration > 0 THEN MIN(positionSeconds / duration, 1.0) ELSE 0.0 END)
         END AS percentProgress FROM tracks WHERE bookId = ?`,
        bookId,
      );
      const percentProgress = Math.min(100, Math.max(0, totals?.percentProgress ?? 0));
      await database.runAsync(
        'UPDATE books SET lastPlayedAt = ?, lastPlayedTrackId = ?, percentProgress = ? WHERE id = ? AND userId = ?',
        lastPlayedAt,
        trackId,
        percentProgress,
        bookId,
        userId,
      );
      assertActive?.();
      saved = { ...progress, completed, positionSeconds: position, percentProgress };
    });
    return saved;
  });
}

/** Updates only playback fields. The selected track must belong to this user's book. */
export async function updateBook(
  userId: string,
  bookId: string,
  changes: BookPlaybackUpdate,
): Promise<boolean> {
  const { lastPlayedAt, lastPlayedTrackId, percentProgress } = changes;
  assertPlaybackTimestamp(lastPlayedAt);
  if (!Number.isFinite(percentProgress) || percentProgress < 0 || percentProgress > 100) {
    throw new RangeError(LIBRARY_ERROR_MESSAGES.invalidBookProgress);
  }

  return withLibraryDatabase(async (database) => {
    const result = await database.runAsync(
      `UPDATE books SET lastPlayedAt = ?, lastPlayedTrackId = ?, percentProgress = ?
       WHERE id = ? AND userId = ?
         AND (? IS NULL OR EXISTS (
           SELECT 1 FROM tracks WHERE id = ? AND bookId = books.id
         ))`,
      lastPlayedAt,
      lastPlayedTrackId,
      percentProgress,
      bookId,
      userId,
      lastPlayedTrackId,
      lastPlayedTrackId,
    );
    return result.changes > 0;
  });
}

/** Updates only this track's playback fields without changing the book or other tracks. */
export async function updateTrack(
  userId: string,
  bookId: string,
  trackId: string,
  changes: TrackPlaybackUpdate,
): Promise<boolean> {
  const { positionSeconds, completed, lastPlayedAt, updatedAt } = changes;
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0) {
    throw new RangeError(LIBRARY_ERROR_MESSAGES.invalidPlaybackPosition);
  }
  assertPlaybackTimestamp(lastPlayedAt);
  assertPlaybackTimestamp(updatedAt);

  return withLibraryDatabase(async (database) => {
    const result = await database.runAsync(
      `UPDATE tracks SET positionSeconds = ?, completed = ?, lastPlayedAt = ?, updatedAt = ?
       WHERE id = ? AND bookId = ?
         AND EXISTS (SELECT 1 FROM books WHERE id = tracks.bookId AND userId = ?)`,
      positionSeconds,
      completed ? 1 : 0,
      lastPlayedAt,
      updatedAt,
      trackId,
      bookId,
      userId,
    );
    return result.changes > 0;
  });
}

/** Deletes the database record and its tracks. Audio and covers are managed separately. */
export function deleteBook(userId: string, bookId: string): Promise<boolean> {
  return withLibraryDatabase(async (database) => {
    const result = await database.runAsync(
      'DELETE FROM books WHERE userId = ? AND id = ?',
      userId,
      bookId,
    );
    return result.changes > 0;
  });
}
