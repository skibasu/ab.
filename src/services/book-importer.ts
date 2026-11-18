import { Directory } from 'expo-file-system';

import { saveBook } from './book-repository';
import { initializeLibraryDatabase } from './library-database';
import { saveBookFiles, type BookToSave, type SavedBookFiles } from './library-storage';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';

/** Copies the book and removes its new directory if the database write fails. */
export async function importBook(userId: string, book: BookToSave): Promise<SavedBookFiles | null> {
  await initializeLibraryDatabase();
  const savedBook = await saveBookFiles(userId, book);
  if (!savedBook) return null;

  try {
    await saveBook(savedBook);
    return savedBook;
  } catch (error) {
    try {
      const directory = new Directory(savedBook.directoryUri);
      if (directory.exists) directory.delete();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        LIBRARY_ERROR_MESSAGES.databaseSaveAndCleanupFailed,
      );
    }
    throw error;
  }
}
