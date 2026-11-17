import { File, FileMode } from 'expo-file-system';
import type { AudioFileReader } from './audio-file-reader.types';

/**
 * Opens a local audio file for reading byte ranges without loading the whole file.
 * Await each read before starting another; the handle has a shared cursor.
 * The caller must close the reader when finished, including after a failed read.
 */
export function openAudioFileReader(uri: string): AudioFileReader {
  const handle = new File(uri).open(FileMode.ReadOnly);
  const size = handle.size;
  let closed = false;

  if (size === null) {
    handle.close();
    throw new Error('Could not determine the audio file size.');
  }

  return {
    size,
    async read(position, length) {
      if (closed) throw new Error('The audio file reader is closed.');
      if (!Number.isSafeInteger(position) || position < 0) {
        throw new RangeError('The read position must be a non-negative safe integer.');
      }
      if (!Number.isSafeInteger(length) || length < 0) {
        throw new RangeError('The read length must be a non-negative safe integer.');
      }
      if (length === 0 || position >= size) return new Uint8Array();

      // Seek directly to the requested byte instead of reading skipped audio data.
      handle.offset = position;
      return await handle.readBytes(Math.min(length, size - position));
    },
    close() {
      if (closed) return;
      closed = true;
      handle.close();
    },
  };
}
