import { Directory, File } from 'expo-file-system';

import { getBook, listBooks, saveBook, updateBookAuthor } from './book-repository';
import { saveBookFiles, type BookToSave, type SavedBookFiles } from './library-storage';
import { findNewBookFiles } from './new-book-files';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { bookGroupKey } from '@/utils/group-files';

/** Imports a new book or appends missing audio files to an existing book. */
export async function importBook(userId: string, book: BookToSave): Promise<SavedBookFiles | null> {
  const key = bookGroupKey(book.title, book.author);
  const books = await listBooks(userId);
  // When older imports left multiple copies, append to the oldest one.
  const match = books.findLast((item) => bookGroupKey(item.title, item.author) === key);
  let existing = match ? await getBook(userId, match.id) : null;
  let newFiles;

  if (!existing) {
    const previousKeys = new Set(
      book.files.flatMap(({ albumArtist }) =>
        albumArtist?.trim() ? [bookGroupKey(book.title, albumArtist)] : [],
      ),
    );

    // Earlier imports used the album artist. Only repair a record when the audio also matches.
    for (const previous of books
      .filter((item) => previousKeys.has(bookGroupKey(item.title, item.author)))
      .reverse()) {
      const candidate = await getBook(userId, previous.id);
      if (!candidate) continue;

      const compared = await findNewBookFiles(book.files, candidate.tracks);
      if (!compared.matchesSavedTrack) continue;

      await updateBookAuthor(userId, candidate.id, book.author);
      existing = candidate;
      newFiles = compared;
      break;
    }
  }

  const { files } = newFiles ?? (await findNewBookFiles(book.files, existing?.tracks ?? []));
  if (files.length === 0) return null;

  const savedBook = await saveBookFiles(userId, { ...book, files }, existing?.id);
  if (!savedBook) return null;

  try {
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
