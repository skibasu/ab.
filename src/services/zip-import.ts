import { randomUUID } from 'expo-crypto';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Directory, File, FileMode, Paths } from 'expo-file-system';

import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { openAudioFileReader } from './audio-file-reader';
import { assertImportNotAborted, BookImportError } from './book-import-error';
import { extractZip } from './zip-reader';
import { createNativeZipExtractor } from './zip-native';
import type { ZipImportCallbacks } from './book-import.types';

export const getImportWorkspaceRoot = () => new Directory(Paths.cache, 'book-import-work');

export function assertImportDiskSpace(bytes: number): void {
  const available = Paths.availableDiskSpace;
  if (!Number.isFinite(available) || available < bytes + BOOK_IMPORT_CONFIG.diskReserveBytes) {
    throw new BookImportError(APP_ERROR_CODES.importNoSpace);
  }
}

/** Only the system picker's disposable copies may be moved/deleted; source documents stay intact. */
function isPickerCacheFile(file: File): boolean {
  const prefix = new Directory(Paths.cache, 'DocumentPicker').uri.replace(/\/$/, '') + '/';
  return file.uri.startsWith(prefix);
}

export function cleanupPickerFiles(assets: DocumentPickerAsset[]): void {
  const errors: unknown[] = [];
  for (const asset of assets) {
    try {
      const file = new File(asset.uri);
      if (isPickerCacheFile(file) && file.exists) file.delete();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length)
    throw new BookImportError(APP_ERROR_CODES.importCleanupFailed, new AggregateError(errors));
}

/** Call under runLibraryOperation, so startup cleanup never races an active extraction. */
export function cleanupImportWorkspaces(): void {
  const root = getImportWorkspaceRoot();
  if (root.exists) root.delete();
}

export type PreparedZip = { files: DocumentPickerAsset[]; cleanup: () => void };

export async function prepareZipImport(
  asset: DocumentPickerAsset,
  signal?: AbortSignal,
  callbacks: ZipImportCallbacks = {},
): Promise<PreparedZip> {
  assertImportNotAborted(signal);
  const source = new File(asset.uri);
  if (!source.exists || source.size <= 0)
    throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
  if (source.size > BOOK_IMPORT_CONFIG.maxZipBytes)
    throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
  const root = getImportWorkspaceRoot();
  root.create({ intermediates: true, idempotent: true });
  const workspace = new Directory(root, randomUUID());
  workspace.create();
  const cleanup = () => {
    if (workspace.exists) workspace.delete();
  };

  try {
    const archive = new File(workspace, 'source.zip');
    if (isPickerCacheFile(source)) {
      await source.move(archive);
    } else {
      assertImportDiskSpace(source.size);
      await source.copy(archive);
    }
    assertImportNotAborted(signal);
    const reader = openAudioFileReader(archive.uri);
    const files: DocumentPickerAsset[] = [];
    const nativeExtract = createNativeZipExtractor(archive.uri, workspace.uri, signal, callbacks);
    try {
      await extractZip(reader, {
        signal,
        onProgress: callbacks.onProgress,
        onAudioExtracted: async () => {
          if (files[0]) await callbacks.onPreview?.(files[0]);
        },
        onManifest: ({ audioBytes }) => assertImportDiskSpace(audioBytes * 2),
        extractEntries: nativeExtract
          ? async (entries) => {
              files.push(...(await nativeExtract(entries)));
            }
          : undefined,
        openOutput(filename) {
          // Never resolve archive paths on disk. Generated names also avoid duplicate-name collisions.
          const destination = new File(workspace, `${randomUUID()}.mp3`);
          destination.create();
          const handle = destination.open(FileMode.WriteOnly);
          files.push({
            uri: destination.uri,
            name: filename.split('/').at(-1)!,
            mimeType: 'audio/mpeg',
            lastModified: Date.now(),
          });
          return {
            async write(bytes) {
              assertImportNotAborted(signal);
              assertImportDiskSpace(bytes.length);
              await handle.writeBytes(bytes);
            },
            close: () => handle.close(),
          };
        },
      });
    } finally {
      reader.close();
    }
    return { files, cleanup };
  } catch (error) {
    try {
      cleanup();
    } catch (cleanupError) {
      throw new BookImportError(
        APP_ERROR_CODES.importCleanupFailed,
        new AggregateError([error, cleanupError]),
      );
    }
    throw error;
  }
}
