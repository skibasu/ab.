import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { parseBuffer, selectCover, type IAudioMetadata, type IPicture } from 'music-metadata';

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

export async function readBookFilesMetadata(
  files: DocumentPickerAsset[],
): Promise<BookFileWithMetadata[]> {
  const filesWithMetadata: BookFileWithMetadata[] = [];

  // Read sequentially to avoid loading multiple audio files into memory at once.
  // Each file is still loaded in full; large audiobooks need a chunked reader.
  for (const selectedFile of files) {
    const file = new File(selectedFile.uri);
    const bytes = await file.bytes();
    const metadata = await parseBuffer(
      bytes,
      { mimeType: 'audio/mpeg', size: bytes.length },
      { skipCovers: false },
    );

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
  }

  return filesWithMetadata;
}
