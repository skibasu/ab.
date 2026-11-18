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

/** Stores successfully copied tracks and updates the book in one transaction. */
export async function saveBook(book: SavedBookFiles, append = false): Promise<void> {
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
    .map<LibraryTrack>((file, position) => ({
      id: file.id,
      title: file.title?.trim() || file.name,
      filePath: file.relativePath,
      duration: file.duration ?? null,
      position,
    }));

  await withLibraryDatabase((database) =>
    database.withTransactionAsync(async () => {
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

export function updateBookAuthor(userId: string, bookId: string, author: string): Promise<void> {
  return withLibraryDatabase(async (database) => {
    await database.runAsync(
      'UPDATE books SET author = ? WHERE id = ? AND userId = ?',
      author,
      bookId,
      userId,
    );
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
