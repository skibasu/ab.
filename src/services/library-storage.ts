import { Directory, Paths } from 'expo-file-system';

export function initializeLibrary(userId: string): Directory {
  const library = new Directory(Paths.document, 'library', userId, 'books');

  library.create({
    idempotent: true,
    intermediates: true,
  });

  return library;
}
