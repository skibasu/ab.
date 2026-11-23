import { randomUUID } from 'expo-crypto';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { assertImportNotAborted, BookImportError } from './book-import-error';
import type { NativeZipEntry } from './zip-reader';

type NativeZipModule = {
  begin: (id: string) => void;
  cancel: (id: string) => void;
  extract: (
    id: string,
    archiveURI: string,
    destinationURI: string,
    entries: { size: number; checksum: number; directory: boolean; output: string | null }[],
    maxBytes: number,
    chunkBytes: number,
  ) => Promise<'invalid' | 'cancelled' | 'limit' | 'noSpace' | null>;
};

/** Native decoding and file writes stay off the JS thread; only the validated manifest crosses it. */
export function createNativeZipExtractor(
  archiveURI: string,
  destinationURI: string,
  signal?: AbortSignal,
): (entries: NativeZipEntry[]) => Promise<DocumentPickerAsset[]> {
  return async (entries) => {
    assertImportNotAborted(signal);
    const native = requireOptionalNativeModule<NativeZipModule>('BookZip');
    if (!native) throw new BookImportError(APP_ERROR_CODES.importNativeBuildRequired);
    const id = randomUUID();
    const files: DocumentPickerAsset[] = [];
    const outputs = entries.map((entry) => {
      const output = entry.audio ? `${randomUUID()}.mp3` : null;
      if (output) {
        files.push({
          uri: `${destinationURI.replace(/\/$/, '')}/${output}`,
          name: entry.filename.split('/').at(-1)!,
          mimeType: 'audio/mpeg',
          lastModified: Date.now(),
        });
      }
      return { size: entry.size, checksum: entry.checksum, directory: entry.directory, output };
    });
    const cancel = () => native.cancel(id);
    native.begin(id);
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      if (signal?.aborted) cancel();
      const result = await native.extract(
        id,
        archiveURI,
        destinationURI,
        outputs,
        BOOK_IMPORT_CONFIG.maxUncompressedBytes,
        BOOK_IMPORT_CONFIG.chunkBytes,
      );
      assertImportNotAborted(signal);
      if (result) {
        const codes = {
          invalid: APP_ERROR_CODES.importInvalidZip,
          cancelled: APP_ERROR_CODES.importCancelled,
          limit: APP_ERROR_CODES.importLimitExceeded,
          noSpace: APP_ERROR_CODES.importNoSpace,
        } as const;
        throw new BookImportError(codes[result]);
      }
      return files;
    } finally {
      // Await extraction completion before callers remove the workspace.
      signal?.removeEventListener('abort', cancel);
    }
  };
}
