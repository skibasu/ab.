import { File, Paths } from 'expo-file-system';

import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { LOG_MESSAGES } from '@/constants/log-messages';
import type { LibraryBook } from './book-repository';
import { withLibraryDatabase } from './library-database';
import { getBookRelativePath } from './library-storage';
import { findOpenLibraryCover } from './open-library-cover';

type CoverTarget = Pick<LibraryBook, 'id' | 'userId' | 'title' | 'author'>;

/** Downloads a cover for an imported book and replaces its default cover if it still exists. */
export async function enrichBookCover(book: CoverTarget): Promise<string | null> {
  const details = { bookId: book.id, title: book.title, author: book.author };

  try {
    const bytes = await findOpenLibraryCover(book.title, book.author);
    if (!bytes) return null;

    return await withLibraryDatabase(async (database) => {
      // Serialize the file write with resets and check that the book still uses the default cover.
      const current = await database.getFirstAsync<{ coverPath: string }>(
        'SELECT coverPath FROM books WHERE id = ? AND userId = ? AND title = ? AND author = ?',
        book.id,
        book.userId,
        book.title,
        book.author,
      );
      if (current?.coverPath !== DEFAULT_BOOK_COVER_PATH) return null;

      const path = `${getBookRelativePath(book.userId, book.id)}/cover.jpg`;
      const file = new File(Paths.document, path);

      try {
        await file.write(bytes);
        await database.runAsync(
          'UPDATE books SET coverPath = ? WHERE id = ? AND userId = ?',
          path,
          book.id,
          book.userId,
        );
      } catch (error) {
        try {
          if (file.exists) file.delete();
        } catch (cleanupError) {
          console.warn(LOG_MESSAGES.bookImport.remoteCoverCleanupFailed, details, cleanupError);
        }
        throw error;
      }

      return path;
    });
  } catch (error) {
    console.warn(LOG_MESSAGES.bookImport.remoteCoverSkipped, details, error);
    return null;
  }
}
