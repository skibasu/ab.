import type { DocumentPickerAsset } from 'expo-document-picker';

import type { ZipImportCallbacks } from './book-import.types';
import type { NativeZipEntry } from './zip-reader';

export type NativeZipExtractor = (entries: NativeZipEntry[]) => Promise<DocumentPickerAsset[]>;

/** Android/web retain the bounded JS backend; the first native import target is iPhone. */
export const createNativeZipExtractor: (
  archiveURI: string,
  destinationURI: string,
  signal?: AbortSignal,
  callbacks?: ZipImportCallbacks,
) => NativeZipExtractor | undefined = () => undefined;
