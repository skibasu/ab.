import { withLibraryDatabase } from './library-database';
import type { SavedBookFiles } from './library-storage';
import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';

export type LibraryBook = {
  id: string;
  userId: string;
  title: string;
  author: string;
  duration: number | null;
  coverPath: string;
  createdAt: number;
};

export type LibraryTrack = {
  id: string;
  title: string;
  filePath: string;
  duration: number | null;
  position: number;
};

export type LibraryBookWithTracks = LibraryBook & { tracks: LibraryTrack[] };

const filenameOrder = new Intl.Collator(undefined, { numeric: true });

/** Stores a book and all successfully copied tracks in one transaction. */
export async function saveBook(book: SavedBookFiles): Promise<void> {
  if (book.files.length === 0) throw new Error(LIBRARY_ERROR_MESSAGES.emptyBook);

  const tracks = [...book.files]
    .sort(
      (first, second) =>
        (first.disk.no ?? 1) - (second.disk.no ?? 1) ||
        (first.track.no ?? Infinity) - (second.track.no ?? Infinity) ||
        filenameOrder.compare(first.name, second.name),
    )
    .map<LibraryTrack>((file, position) => ({
      id: file.id,
      title: file.title?.trim() || file.name,
      filePath: file.relativePath,
      duration: file.duration ?? null,
      position,
    }));

  const duration = tracks.reduce<number | null>(
    (total, track) => (total === null || track.duration === null ? null : total + track.duration),
    0,
  );

  await withLibraryDatabase((database) =>
    database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO books (id, userId, title, author, duration, coverPath, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        book.bookId,
        book.userId,
        book.title,
        book.author,
        duration,
        book.coverRelativePath?.trim() || DEFAULT_BOOK_COVER_PATH,
        Date.now(),
      );

      for (const track of tracks) {
        await database.runAsync(
          `INSERT INTO tracks (id, bookId, title, filePath, duration, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
          track.id,
          book.bookId,
          track.title,
          track.filePath,
          track.duration,
          track.position,
        );
      }
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
             'duration', duration, 'position', position
           ))
           FROM (
             SELECT id, title, filePath, duration, position
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
      tracks: JSON.parse(tracksJson) as LibraryTrack[],
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

    const tracks = await database.getAllAsync<LibraryTrack>(
      'SELECT id, title, filePath, duration, position FROM tracks WHERE bookId = ? ORDER BY position',
      bookId,
    );
    return { ...book, tracks };
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
