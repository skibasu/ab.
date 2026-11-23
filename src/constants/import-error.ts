import { APP_ERROR_CODES } from './errors';

/** User-facing import copy, kept separate from technical exception messages. */
export const IMPORT_ERROR_CONTENT = {
  title: 'Import failed',
  chooseFiles: 'Choose files again',
  backToLibrary: 'Back to Library',
  partial: 'Successfully imported files are still available in your library.',
  messages: {
    [APP_ERROR_CODES.importFailed]:
      'We couldn’t read the selected files. Check the format and try again.',
    [APP_ERROR_CODES.importInvalidZip]:
      'This ZIP is damaged or contains unsafe files. Download it again or choose another archive.',
    [APP_ERROR_CODES.importEncryptedZip]:
      'Password-protected ZIP files aren’t supported. Choose an unencrypted archive or import its MP3 files.',
    [APP_ERROR_CODES.importUnsupportedZip]:
      'This ZIP uses an unsupported compression method. Create a standard ZIP or choose its MP3 files.',
    [APP_ERROR_CODES.importNoAudio]:
      'No readable MP3 files were found. Choose MP3 files or a ZIP containing them.',
    [APP_ERROR_CODES.importNoSpace]:
      'There isn’t enough free space to import these files. Free up storage on your device and try again.',
    [APP_ERROR_CODES.importCleanupFailed]:
      'We couldn’t finish cleaning up the import. Some files may already be in your library. Restart the app before trying again.',
    [APP_ERROR_CODES.importNativeBuildRequired]:
      'This app needs an updated iOS build to import ZIP files. Install the latest development build and try again.',
    [APP_ERROR_CODES.importFileReadFailed]:
      'Some selected audio files couldn’t be read. Check that they are complete MP3 files and try again.',
    [APP_ERROR_CODES.importFileSaveFailed]:
      'Some audio files couldn’t be saved. Check your device storage and try again.',
    [APP_ERROR_CODES.importLimitExceeded]:
      'The selected files exceed an import limit. Choose fewer files or a smaller archive.',
  },
  limits: {
    maxZipFiles: (maximum: string) =>
      `Choose one ZIP at a time. The limit is ${maximum} archive per import.`,
    maxZipBytes: (maximum: string, actual?: string) =>
      `The ZIP${actual ? ` (${actual})` : ''} exceeds the ${maximum} archive limit. Choose a smaller ZIP.`,
    maxMp3Files: (maximum: string, actual?: string) =>
      `The selection${actual ? ` (${actual} MP3 files)` : ''} exceeds the limit of ${maximum} MP3 files per import. Choose fewer files.`,
    maxDirectMp3Bytes: (maximum: string, actual?: string) =>
      `The selected MP3 files${actual ? ` (${actual} in total)` : ''} exceed the ${maximum} limit per import. Import them in smaller batches.`,
    maxArchiveEntries: (maximum: string, actual?: string) =>
      `The ZIP${actual ? ` (${actual} entries)` : ''} exceeds the limit of ${maximum} entries, including files and folders. Choose a smaller archive.`,
    maxUncompressedBytes: (maximum: string) =>
      `The ZIP expands beyond the ${maximum} limit. Split it into smaller archives.`,
    maxMetadataReadBytes: (maximum: string) =>
      `The ZIP directory exceeds the ${maximum} processing limit. Create a new standard ZIP and try again.`,
  },
} as const;
