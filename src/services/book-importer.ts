import { Directory, File } from 'expo-file-system';

import { getBook, listBooks, saveBook } from './book-repository';
import { saveBookFiles, type BookToSave, type SavedBookFiles } from './library-storage';
import { findNewBookFiles } from './new-book-files';
import { findOpenLibraryCover } from './open-library-cover';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { bookGroupKey } from '@/utils/group-files';

/** Imports a new book or appends missing audio files to an existing book. */
export async function importBook(userId: string, book: BookToSave): Promise<SavedBookFiles | null> {
  const key = bookGroupKey(book.title, book.author);
  const books = await listBooks(userId);
  // When older imports left multiple copies, append to the oldest one.
  const match = books.findLast((item) => bookGroupKey(item.title, item.author) === key);
  const existing = match ? await getBook(userId, match.id) : null;
  const files = await findNewBookFiles(book.files, existing?.tracks ?? []);
  if (files.length === 0) return null;

  const savedBook = await saveBookFiles(userId, { ...book, files }, existing?.id);
  if (!savedBook) return null;

  try {
    if (!existing && !savedBook.coverRelativePath) await saveOpenLibraryCover(savedBook);
    await saveBook(savedBook, existing !== null);
    return savedBook;
  } catch (error) {
    try {
      if (existing) {
        for (const { uri } of savedBook.files) {
          const file = new File(uri);
          if (file.exists) file.delete();
        }
      } else {
        const directory = new Directory(savedBook.directoryUri);
        if (directory.exists) directory.delete();
      }
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        LIBRARY_ERROR_MESSAGES.databaseSaveAndCleanupFailed,
      );
    }
    throw error;
  }
}

async function saveOpenLibraryCover(book: SavedBookFiles): Promise<void> {
  let file: File | undefined;

  try {
    const bytes = await findOpenLibraryCover(book.title, book.author);
    if (!bytes) return;

    const filename = 'cover.jpg';
    file = new File(book.directoryUri, filename);
    await file.write(bytes);
    book.coverUri = file.uri;
    book.coverRelativePath = `${book.relativePath}/${filename}`;
    book.coverMimeType = 'image/jpeg';
  } catch (error) {
    console.warn(LOG_MESSAGES.bookImport.remoteCoverSkipped, { bookId: book.bookId }, error);
    try {
      if (file?.exists) file.delete();
    } catch (cleanupError) {
      console.warn(
        LOG_MESSAGES.bookImport.remoteCoverCleanupFailed,
        { bookId: book.bookId },
        cleanupError,
      );
    }
  }
}
