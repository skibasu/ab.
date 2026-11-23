import { Directory, File } from 'expo-file-system';

import { getBook, listBooks, saveBook, updateBookAuthor } from './book-repository';
import { saveBookFiles, type BookToSave, type SavedBookFiles } from './library-storage';
import { findNewBookFiles } from './new-book-files';
import { APP_ERROR_CODES, LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { bookGroupKey } from '@/utils/group-files';
import type { BookImportErrorCode } from './book-import-error';

/** Imports a new book or appends missing audio files to an existing book. */
export async function importBook(
  userId: string,
  book: BookToSave,
  assertActive?: () => void,
  onVerified?: (bookId: string) => void,
  onProgress?: (fraction: number) => void,
  onIssue?: (code: BookImportErrorCode) => void,
): Promise<SavedBookFiles | null> {
  assertActive?.();
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

      assertActive?.();
      await updateBookAuthor(userId, candidate.id, book.author, assertActive);
      existing = candidate;
      newFiles = compared;
      break;
    }
  }

  const { files, skippedFiles } =
    newFiles ??
    (await findNewBookFiles(book.files, existing?.tracks ?? [], (value) =>
      onProgress?.(value * 0.45),
    ));
  assertActive?.();
  if (skippedFiles) onIssue?.(APP_ERROR_CODES.importFileReadFailed);
  if (files.length === 0) {
    if (!skippedFiles && existing) onVerified?.(existing.id);
    onProgress?.(1);
    return null;
  }

  assertActive?.();
  const savedBook = await saveBookFiles(
    userId,
    { ...book, files },
    existing?.id,
    assertActive,
    (value) => onProgress?.(0.45 + value * 0.45),
  );
  if (!savedBook) {
    onIssue?.(APP_ERROR_CODES.importFileSaveFailed);
    return null;
  }

  try {
    await saveBook(savedBook, existing !== null, assertActive);
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
  if (!skippedFiles && !savedBook.skippedFiles.length) onVerified?.(savedBook.bookId);
  if (savedBook.skippedFiles.length) onIssue?.(APP_ERROR_CODES.importFileSaveFailed);
  onProgress?.(1);
  return savedBook;
}
