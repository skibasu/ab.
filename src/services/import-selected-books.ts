import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';

import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAuthStore } from '@/stores/auth-store';
import { groupFiles } from '@/utils/group-files';
import { assertImportNotAborted, BookImportError } from './book-import-error';
import { importBook } from './book-importer';
import { readBookFilesMetadata } from './book-metadata';
import { hasCompletedZip, rememberCompletedZip } from './zip-import-history';
import {
  assertImportDiskSpace,
  cleanupPickerFiles,
  prepareZipImport,
  type PreparedZip,
} from './zip-import';

export type BookImportStage = 'preparing' | 'saving';
type ImportOptions = { signal?: AbortSignal; onStageChange?: (stage: BookImportStage) => void };

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
  let zip: PreparedZip | undefined;
  let zipIdentity: { digest: string; size: number } | undefined;

  try {
    assertActive();
    options.onStageChange?.('preparing');
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
          console.info(LOG_MESSAGES.bookImport.duplicateZipSkipped, { name: files[0].name });
          return { savedBooks: 0, failedBooks: 0 };
        }
      } catch (error) {
        assertActive();
        console.warn(LOG_MESSAGES.bookImport.zipHistoryUnavailable, { name: files[0].name }, error);
      }
      zip = await prepareZipImport(files[0], controller.signal);
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
    const metadata = await readBookFilesMetadata(audioFiles, controller.signal);
    assertActive();
    if (!metadata.length) throw new BookImportError(APP_ERROR_CODES.importNoAudio);
    const books = groupFiles(metadata);
    options.onStageChange?.('saving');
    const result = { savedBooks: 0, failedBooks: 0 };
    const verifiedBookIds: string[] = [];
    // Sequential commits preserve source order and keep resource usage bounded.
    for (const book of books) {
      assertActive();
      try {
        if (await importBook(userId, book, assertActive, (id) => verifiedBookIds.push(id)))
          result.savedBooks++;
      } catch (error) {
        assertActive();
        result.failedBooks++;
        console.error(LOG_MESSAGES.bookImport.bookSaveFailed, { title: book.title }, error);
      }
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
