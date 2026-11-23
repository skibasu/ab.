import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { BookFileWithMetadata } from './book-metadata';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';

export type BookToSave = {
  title: string;
  author: string;
  files: BookFileWithMetadata[];
};

export type SavedBookFile = Pick<
  BookFileWithMetadata,
  'name' | 'title' | 'track' | 'disk' | 'duration'
> & {
  id: string;
  uri: string;
  relativePath: string;
};

export type SavedBookFiles = {
  bookId: string;
  userId: string;
  title: string;
  author: string;
  directoryUri: string;
  relativePath: string;
  files: SavedBookFile[];
  skippedFiles: Pick<BookFileWithMetadata, 'name' | 'uri'>[];
  coverUri: string | null;
  coverRelativePath: string | null;
  coverMimeType: string | null;
};

const COVER_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

export function getLibraryRoot(): Directory {
  return new Directory(Paths.document, 'library');
}

export function getBookRelativePath(userId: string, bookId: string): string {
  return `library/${userId}/books/${bookId}`;
}

/**
 * Ensures Documents/library/<userId>/books exists in the app's local storage.
 * Safe to call on every login or before import; existing files remain untouched.
 * Returns a directory reference for later book storage operations.
 */
export function initializeLibrary(userId: string): Directory {
  const library = new Directory(getLibraryRoot(), userId, 'books');

  library.create({
    idempotent: true,
    intermediates: true,
  });

  return library;
}

/**
 * Copies a grouped book into its directory. An append keeps the existing cover.
 * Source files remain in cache. Relative paths are based on Paths.document.
 * Skips failed MP3 copies and a failed cover write; source files stay untouched.
 * Returns null and removes the new directory if no audio files could be saved.
 * Directory-level failures still reject and roll back the affected book.
 * Does not persist a library record, check for duplicate books, or change file order.
 */
export async function saveBookFiles(
  userId: string,
  book: BookToSave,
  existingBookId?: string,
  assertActive?: () => void,
): Promise<SavedBookFiles | null> {
  assertActive?.();
  if (!userId || userId === '.' || userId === '..' || /[/\\]/.test(userId)) {
    throw new Error(LIBRARY_ERROR_MESSAGES.invalidUserId);
  }
  if (book.files.length === 0) {
    throw new Error(LIBRARY_ERROR_MESSAGES.emptyBook);
  }

  const library = initializeLibrary(userId);
  const bookId = existingBookId ?? randomUUID();
  const relativePath = getBookRelativePath(userId, bookId);
  const bookDirectory = new Directory(library, bookId);

  // Fail on a collision before entering rollback, so an existing directory is never deleted.
  bookDirectory.create(existingBookId ? { idempotent: true } : undefined);
  const newFiles: File[] = [];

  try {
    const files: SavedBookFile[] = [];
    const skippedFiles: SavedBookFiles['skippedFiles'] = [];
    let cover: BookFileWithMetadata['cover'] = null;

    for (const sourceFile of book.files) {
      assertActive?.();
      // Generated names avoid collisions between parts with identical source filenames.
      const id = randomUUID();
      const filename = `${id}.mp3`;
      const destination = new File(bookDirectory, filename);
      if (destination.exists) throw new Error(LIBRARY_ERROR_MESSAGES.trackDestinationExists);
      newFiles.push(destination);
      try {
        await new File(sourceFile.uri).copy(destination);
      } catch (error) {
        // Remove a partial copy before continuing with the remaining parts.
        if (destination.exists) destination.delete();
        skippedFiles.push({ name: sourceFile.name, uri: sourceFile.uri });
        console.warn(
          LOG_MESSAGES.bookImport.fileCopySkipped,
          { name: sourceFile.name, uri: sourceFile.uri },
          error,
        );
        continue;
      }

      assertActive?.();
      cover ??= sourceFile.cover;

      files.push({
        id,
        name: sourceFile.name,
        title: sourceFile.title,
        track: sourceFile.track,
        disk: sourceFile.disk,
        duration: sourceFile.duration,
        uri: destination.uri,
        relativePath: `${relativePath}/${filename}`,
      });
    }

    assertActive?.();
    if (files.length === 0) {
      if (!existingBookId) bookDirectory.delete();
      console.warn(LOG_MESSAGES.bookImport.emptyBookSkipped, { title: book.title, skippedFiles });
      return null;
    }

    let coverUri: string | null = null;
    let coverRelativePath: string | null = null;
    let coverMimeType: string | null = null;

    if (cover && !existingBookId) {
      const extension = COVER_EXTENSIONS[cover.format];
      // Preserve unfamiliar image formats as raw bytes without assigning a wrong extension.
      const filename = extension ? `cover.${extension}` : 'cover';
      const coverFile = new File(bookDirectory, filename);
      try {
        coverFile.create();
        await coverFile.write(cover.data);
        coverUri = coverFile.uri;
        coverRelativePath = `${relativePath}/${filename}`;
        coverMimeType = cover.format;
      } catch (error) {
        if (coverFile.exists) coverFile.delete();
        console.warn(LOG_MESSAGES.bookImport.coverSkipped, { bookId, title: book.title }, error);
      }
    }

    assertActive?.();
    return {
      bookId,
      userId,
      title: book.title,
      author: book.author,
      directoryUri: bookDirectory.uri,
      relativePath,
      files,
      skippedFiles,
      coverUri,
      coverRelativePath,
      coverMimeType,
    };
  } catch (error) {
    try {
      if (existingBookId) {
        for (const file of newFiles) if (file.exists) file.delete();
      } else if (bookDirectory.exists) bookDirectory.delete();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], LIBRARY_ERROR_MESSAGES.saveAndCleanupFailed);
    }
    throw error;
  }
}
