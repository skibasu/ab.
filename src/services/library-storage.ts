import { Directory, Paths } from 'expo-file-system';

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
