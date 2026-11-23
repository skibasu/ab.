import { randomUUID } from 'expo-crypto';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { ZipImportCallbacks } from './book-import.types';

import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { assertImportNotAborted, BookImportError } from './book-import-error';
import type { NativeZipEntry } from './zip-reader';

type ZipStatus = 'invalid' | 'cancelled' | 'limit' | 'noSpace' | null;
type NativeZipModule = {
  addListener?: (
    name: 'onProgress',
    listener: (event: { id: string; written: number; total: number }) => void,
  ) => { remove: () => void };
  extractStage?: (
    id: string,
    archiveURI: string,
    destinationURI: string,
    entries: { size: number; checksum: number; directory: boolean; output: string | null }[],
    maxBytes: number,
    chunkBytes: number,
    phase: string,
  ) => Promise<ZipStatus>;
  begin: (id: string) => void;
  cancel: (id: string) => void;
  extract: (
    id: string,
    archiveURI: string,
    destinationURI: string,
    entries: { size: number; checksum: number; directory: boolean; output: string | null }[],
    maxBytes: number,
    chunkBytes: number,
  ) => Promise<ZipStatus>;
};

/** Native decoding and file writes stay off the JS thread; only the validated manifest crosses it. */
export function createNativeZipExtractor(
  archiveURI: string,
  destinationURI: string,
  signal?: AbortSignal,
  callbacks: ZipImportCallbacks = {},
): (entries: NativeZipEntry[]) => Promise<DocumentPickerAsset[]> {
  return async (entries) => {
    assertImportNotAborted(signal);
    const native = requireOptionalNativeModule<NativeZipModule>('BookZip');
    if (!native || ((callbacks.onPreview || callbacks.onProgress) && !native.extractStage))
      throw new BookImportError(APP_ERROR_CODES.importNativeBuildRequired);
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
    const run = async (phase: 'preview' | 'remaining' | 'all') => {
      const jobId = `${id}-${phase}`;
      const cancel = () => native.cancel(jobId);
      native.begin(jobId);
      const subscription = native.addListener?.('onProgress', (event) => {
        if (event.id === jobId && !signal?.aborted && event.total > 0)
          callbacks.onProgress?.(event.written / event.total);
      });
      signal?.addEventListener('abort', cancel, { once: true });
      try {
        if (signal?.aborted) cancel();
        const args = [
          jobId,
          archiveURI,
          destinationURI,
          outputs,
          BOOK_IMPORT_CONFIG.maxUncompressedBytes,
          BOOK_IMPORT_CONFIG.chunkBytes,
        ] as const;
        const result = native.extractStage
          ? await native.extractStage(...args, phase)
          : await native.extract(...args);
        assertImportNotAborted(signal);
        if (result) {
          const codes = {
            invalid: APP_ERROR_CODES.importInvalidZip,
            cancelled: APP_ERROR_CODES.importCancelled,
            limit: APP_ERROR_CODES.importLimitExceeded,
            noSpace: APP_ERROR_CODES.importNoSpace,
          } as const;
          throw new BookImportError(
            codes[result],
            undefined,
            result === 'limit'
              ? { limit: 'maxUncompressedBytes', maximum: BOOK_IMPORT_CONFIG.maxUncompressedBytes }
              : undefined,
          );
        }
      } finally {
        // Wait for native writes to stop before the caller is allowed to remove the workspace.
        subscription?.remove();
        signal?.removeEventListener('abort', cancel);
      }
    };
    if (callbacks.onPreview && files.length) {
      await run('preview');
      await callbacks.onPreview(files[0]);
      assertImportNotAborted(signal);
      await run('remaining');
    } else {
      await run('all');
    }
    callbacks.onProgress?.(1);
    return files;
  };
}
