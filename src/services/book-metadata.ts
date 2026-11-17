import type { DocumentPickerAsset } from 'expo-document-picker';
import {
  parseFromTokenizer,
  selectCover,
  type IAudioMetadata,
  type IPicture,
} from 'music-metadata';

import { openAudioFileReader } from './audio-file-reader';
import { AudioFileTokenizer } from './audio-file-tokenizer';

/** Selected file details plus embedded tags used for grouping and ordering book parts. */
export type BookFileWithMetadata = DocumentPickerAsset & {
  album: string | undefined;
  albumArtist: string | undefined;
  artist: string | undefined;
  title: string | undefined;
  track: IAudioMetadata['common']['track'];
  disk: IAudioMetadata['common']['disk'];
  duration: number | undefined;
  cover: IPicture | null;
};

/**
 * Reads MP3 tags and an embedded cover from each selected local file, one at a time.
 * Returns enriched file records for grouping; does not copy files or create books.
 * Missing tags remain undefined and a missing cover is null. Read errors propagate.
 */
export async function readBookFilesMetadata(
  files: DocumentPickerAsset[],
): Promise<BookFileWithMetadata[]> {
  const filesWithMetadata: BookFileWithMetadata[] = [];

  for (const selectedFile of files) {
    const reader = openAudioFileReader(selectedFile.uri);
    const tokenizer = new AudioFileTokenizer(reader);

    try {
      const metadata = await parseFromTokenizer(tokenizer, { skipCovers: false });

      filesWithMetadata.push({
        ...selectedFile,
        album: metadata.common.album,
        albumArtist: metadata.common.albumartist,
        artist: metadata.common.artist,
        title: metadata.common.title,
        track: metadata.common.track,
        disk: metadata.common.disk,
        duration: metadata.format.duration,
        cover: selectCover(metadata.common.picture),
      });
    } finally {
      // Release the native file handle even if parsing or cover extraction fails.
      await tokenizer.close();
    }
  }

  return filesWithMetadata;
}
