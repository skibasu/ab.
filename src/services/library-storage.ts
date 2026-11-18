import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { BookFileWithMetadata } from './book-metadata';

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

/**
 * Ensures Documents/library/<userId>/books exists in the app's local storage.
 * Safe to call on every login or before import; existing files remain untouched.
 * Returns a directory reference for later book storage operations.
 */
export function initializeLibrary(userId: string): Directory {
  const library = new Directory(Paths.document, 'library', userId, 'books');

  library.create({
    idempotent: true,
    intermediates: true,
  });

  return library;
}

/**
 * Copies one grouped book into a new UUID directory and saves its first available cover.
 * Source files remain in cache. Relative paths are based on Paths.document.
 * Removes only the newly created book directory if any copy or cover write fails.
 * Does not persist a library record, check for duplicate books, or change file order.
 */
export async function saveBookFiles(userId: string, book: BookToSave): Promise<SavedBookFiles> {
  if (!userId || userId === '.' || userId === '..' || /[/\\]/.test(userId)) {
    throw new Error('A valid user ID is required to save book files.');
  }
  if (book.files.length === 0) {
    throw new Error('A book must contain at least one audio file.');
  }

  const library = initializeLibrary(userId);
  const bookId = randomUUID();
  const relativePath = `library/${userId}/books/${bookId}`;
  const bookDirectory = new Directory(library, bookId);

  // Fail on a collision before entering rollback, so an existing directory is never deleted.
  bookDirectory.create();

  try {
    const files: SavedBookFile[] = [];

    for (const sourceFile of book.files) {
      // Generated names avoid collisions between parts with identical source filenames.
      const id = randomUUID();
      const filename = `${id}.mp3`;
      const destination = new File(bookDirectory, filename);
      await new File(sourceFile.uri).copy(destination);

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

    let coverUri: string | null = null;
    let coverRelativePath: string | null = null;
    let coverMimeType: string | null = null;
    const cover = book.files.find((file) => file.cover !== null)?.cover;

    if (cover) {
      const extension = COVER_EXTENSIONS[cover.format];
      // Preserve unfamiliar image formats as raw bytes without assigning a wrong extension.
      const filename = extension ? `cover.${extension}` : 'cover';
      const coverFile = new File(bookDirectory, filename);
      coverFile.create();
      await coverFile.write(cover.data);
      coverUri = coverFile.uri;
      coverRelativePath = `${relativePath}/${filename}`;
      coverMimeType = cover.format;
    }

    return {
      bookId,
      userId,
      title: book.title,
      author: book.author,
      directoryUri: bookDirectory.uri,
      relativePath,
      files,
      coverUri,
      coverRelativePath,
      coverMimeType,
    };
  } catch (error) {
    try {
      if (bookDirectory.exists) bookDirectory.delete();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Failed to save book files and clean up the new directory.',
      );
    }
    throw error;
  }
}
