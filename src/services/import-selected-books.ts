import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';

import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAuthStore } from '@/stores/auth-store';
import { groupFiles } from '@/utils/group-files';
import { assertImportNotAborted, BookImportError } from './book-import-error';
import { importBook } from './book-importer';
import type { BookFileWithMetadata } from './book-metadata';
import type { BookImportUpdate } from './book-import.types';
import { createBookImportPreviews } from './book-import-previews';
import { hasCompletedZip, rememberCompletedZip } from './zip-import-history';
import {
  assertImportDiskSpace,
  cleanupPickerFiles,
  prepareZipImport,
  type PreparedZip,
} from './zip-import';

export type BookImportStage = 'preparing' | 'saving';
type ImportOptions = {
  signal?: AbortSignal;
  onStageChange?: (stage: BookImportStage) => void;
  onUpdate?: (update: BookImportUpdate) => void;
  deferPreviewCleanup?: (cleanup: () => void) => void;
};

/** The caller holds runLibraryOperation while selecting, preparing and saving files. */
export async function importSelectedBooks(
  userId: string,
  files: DocumentPickerAsset[],
  type: 'audio/mpeg' | 'application/zip',
  options: ImportOptions = {},
): Promise<{ savedBooks: number; failedBooks: number }> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel);
  if (options.signal?.aborted) cancel();
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (state.user?.uid !== userId) cancel();
  });
  const assertActive = () => {
    if (!userId || useAuthStore.getState().user?.uid !== userId) cancel();
    assertImportNotAborted(controller.signal);
  };
  let progress = 0;
  const update = (value: BookImportUpdate) => {
    assertActive();
    progress = Math.max(progress, value.progress ?? progress);
    options.onUpdate?.({ ...value, progress });
  };
  const previews = createBookImportPreviews(update, assertActive, controller.signal);
  let zip: PreparedZip | undefined;
  let zipIdentity: { digest: string; size: number } | undefined;

  try {
    assertActive();
    options.onStageChange?.('preparing');
    update({ stage: 'preparing', progress: 0 });
    if (!files.length) return { savedBooks: 0, failedBooks: 0 };
    let audioFiles: DocumentPickerAsset[];
    if (type === 'application/zip') {
      if (files.length > BOOK_IMPORT_CONFIG.maxZipFiles) {
        throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
      }
      const source = new File(files[0].uri);
      if (!source.exists || !Number.isSafeInteger(source.size) || source.size <= 0)
        throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
      if (source.size > BOOK_IMPORT_CONFIG.maxZipBytes)
        throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
      try {
        zipIdentity = { digest: await source.digest('SHA-256'), size: source.size };
        assertActive();
        if (await hasCompletedZip(userId, zipIdentity.digest, zipIdentity.size, assertActive)) {
          assertActive();
          update({ stage: 'complete', progress: 100 });
          console.info(LOG_MESSAGES.bookImport.duplicateZipSkipped, { name: files[0].name });
          return { savedBooks: 0, failedBooks: 0 };
        }
      } catch (error) {
        assertActive();
        console.warn(LOG_MESSAGES.bookImport.zipHistoryUnavailable, { name: files[0].name }, error);
      }
      update({ stage: 'extracting', progress: 5 });
      zip = await prepareZipImport(files[0], controller.signal, {
        onProgress: (fraction) =>
          update({ stage: 'extracting', progress: 5 + 60 * Math.max(0, Math.min(1, fraction)) }),
        onPreview: async (file) => {
          await previews.prepare(file);
          update({ stage: 'extracting' });
        },
      });
      audioFiles = zip.files;
    } else {
      if (files.length > BOOK_IMPORT_CONFIG.maxMp3Files) {
        throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
      }
      let bytes = 0;
      audioFiles = [];
      for (const asset of files) {
        try {
          const file = new File(asset.uri);
          if (!file.exists || !Number.isSafeInteger(file.size) || file.size <= 0) {
            throw new BookImportError(APP_ERROR_CODES.importNoAudio);
          }
          bytes += file.size;
          audioFiles.push(asset);
        } catch (error) {
          console.warn(
            LOG_MESSAGES.bookImport.fileMetadataSkipped,
            { name: asset.name, uri: asset.uri },
            error,
          );
        }
      }
      if (bytes > BOOK_IMPORT_CONFIG.maxDirectMp3Bytes) {
        throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
      }
      assertImportDiskSpace(bytes);
      if (!audioFiles.length) throw new BookImportError(APP_ERROR_CODES.importNoAudio);
    }
    assertActive();
    const metadata: BookFileWithMetadata[] = [];
    for (const [index, file] of audioFiles.entries()) {
      const record = await previews.read(file);
      if (record) {
        metadata.push(record);
        await previews.prepare(file);
      }
      update({ stage: 'metadata', progress: 65 + (20 * (index + 1)) / audioFiles.length });
    }
    assertActive();
    if (!metadata.length) throw new BookImportError(APP_ERROR_CODES.importNoAudio);
    const books = groupFiles(metadata);
    for (const book of books) {
      const cover = await previews.prepareCover(book);
      if (cover) book.files = book.files.map((file) => ({ ...file, cover }));
    }
    options.onStageChange?.('saving');
    update({ stage: 'saving', progress: 85 });
    const result = { savedBooks: 0, failedBooks: 0 };
    const verifiedBookIds: string[] = [];
    // Sequential commits preserve source order and keep resource usage bounded.
    for (const [index, book] of books.entries()) {
      assertActive();
      try {
        if (
          await importBook(
            userId,
            book,
            assertActive,
            (id) => verifiedBookIds.push(id),
            (fraction) =>
              update({ stage: 'saving', progress: 85 + (14 * (index + fraction)) / books.length }),
          )
        )
          result.savedBooks++;
      } catch (error) {
        assertActive();
        result.failedBooks++;
        console.error(LOG_MESSAGES.bookImport.bookSaveFailed, { title: book.title }, error);
      }
      update({ stage: 'saving', progress: 85 + (14 * (index + 1)) / books.length });
    }
    if (
      zipIdentity &&
      metadata.length === audioFiles.length &&
      verifiedBookIds.length === books.length &&
      !result.failedBooks
    ) {
      try {
        await rememberCompletedZip(
          userId,
          zipIdentity.digest,
          zipIdentity.size,
          verifiedBookIds,
          assertActive,
        );
      } catch (error) {
        assertActive();
        console.warn(LOG_MESSAGES.bookImport.zipHistoryUnavailable, { name: files[0].name }, error);
      }
    }
    update({ stage: 'complete', progress: 100 });
    return result;
  } finally {
    unsubscribe();
    options.signal?.removeEventListener('abort', cancel);
    const cleanupErrors: unknown[] = [];
    try {
      zip?.cleanup();
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      if (options.deferPreviewCleanup) options.deferPreviewCleanup(() => previews.cleanup());
      else previews.cleanup();
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      cleanupPickerFiles(files);
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length) {
      throw new BookImportError(
        APP_ERROR_CODES.importCleanupFailed,
        new AggregateError(cleanupErrors),
      );
    }
  }
}
