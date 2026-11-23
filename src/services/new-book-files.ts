import { File, Paths } from 'expo-file-system';

import { LOG_MESSAGES } from '@/constants/log-messages';
import type { BookFileWithMetadata } from './book-metadata';
import type { LibraryTrack } from './book-repository';

/** Compares contents so renamed copies are skipped and distinct parts may share a filename. */
export async function findNewBookFiles(
  files: BookFileWithMetadata[],
  tracks: LibraryTrack[],
  onProgress?: (fraction: number) => void,
): Promise<{ files: BookFileWithMetadata[]; matchesSavedTrack: boolean; skippedFiles: number }> {
  const candidates = tracks.map(({ filePath }) => new File(Paths.document, filePath));
  const bySize = new Map<number | null, File[]>();
  const savedUris = new Set<string>();
  const hashes = new Map<string, Promise<string>>();
  const digest = (file: File) => {
    let pending = hashes.get(file.uri);
    if (!pending) {
      pending = file.digest('SHA-256');
      hashes.set(file.uri, pending);
    }
    return pending;
  };
  const add = (file: File, size: number | null) => {
    const bucket = bySize.get(size);
    if (bucket) bucket.push(file);
    else bySize.set(size, [file]);
  };

  for (const file of candidates) {
    if (file.exists) {
      add(file, file.size);
      savedUris.add(file.uri);
    }
  }

  const result: BookFileWithMetadata[] = [];
  let matchesSavedTrack = false;
  let skippedFiles = 0;
  for (const [index, selected] of files.entries()) {
    try {
      const file = new File(selected.uri);
      const size = file.size;
      const matches =
        size === null
          ? Array.from(bySize.values()).flat()
          : [...(bySize.get(size) ?? []), ...(bySize.get(null) ?? [])];
      let duplicate = false;
      for (const candidate of matches) {
        // Hash each file at most once in native code; never send audio chunks through JS.
        if ((await digest(file)) === (await digest(candidate))) {
          duplicate = true;
          if (savedUris.has(candidate.uri)) matchesSavedTrack = true;
          break;
        }
      }
      if (duplicate) continue;

      result.push(selected);
      add(file, size);
    } catch (error) {
      skippedFiles++;
      console.warn(LOG_MESSAGES.bookImport.fileComparisonSkipped, { name: selected.name }, error);
    } finally {
      onProgress?.((index + 1) / files.length);
    }
  }

  return { files: result, matchesSavedTrack, skippedFiles };
}
