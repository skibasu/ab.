import { File, Paths } from 'expo-file-system';

import { LOG_MESSAGES } from '@/constants/log-messages';
import { openAudioFileReader } from './audio-file-reader';
import type { BookFileWithMetadata } from './book-metadata';
import type { LibraryTrack } from './book-repository';

const CHUNK_SIZE = 256 * 1024;

/** Compares contents so renamed copies are skipped and distinct parts may share a filename. */
export async function findNewBookFiles(
  files: BookFileWithMetadata[],
  tracks: LibraryTrack[],
): Promise<{ files: BookFileWithMetadata[]; matchesSavedTrack: boolean }> {
  const candidates = tracks.map(({ filePath }) => new File(Paths.document, filePath));
  const bySize = new Map<number | null, File[]>();
  const savedUris = new Set<string>();
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
  for (const selected of files) {
    try {
      const file = new File(selected.uri);
      const size = file.size;
      const matches =
        size === null
          ? Array.from(bySize.values()).flat()
          : [...(bySize.get(size) ?? []), ...(bySize.get(null) ?? [])];
      let duplicate = false;
      for (const candidate of matches) {
        if (await sameContent(file.uri, candidate.uri)) {
          duplicate = true;
          if (savedUris.has(candidate.uri)) matchesSavedTrack = true;
          break;
        }
      }
      if (duplicate) continue;

      result.push(selected);
      add(file, size);
    } catch (error) {
      console.warn(LOG_MESSAGES.bookImport.fileComparisonSkipped, { name: selected.name }, error);
    }
  }

  return { files: result, matchesSavedTrack };
}

async function sameContent(firstUri: string, secondUri: string): Promise<boolean> {
  const first = openAudioFileReader(firstUri);
  try {
    const second = openAudioFileReader(secondUri);
    try {
      if (first.size !== second.size) return false;
      for (let position = 0; position < first.size;) {
        const firstBytes = await first.read(position, CHUNK_SIZE);
        const secondBytes = await second.read(position, firstBytes.length);
        if (!firstBytes.length || firstBytes.length !== secondBytes.length) return false;
        if (!firstBytes.every((value, index) => value === secondBytes[index])) return false;
        position += firstBytes.length;
      }
      return true;
    } finally {
      second.close();
    }
  } finally {
    first.close();
  }
}
