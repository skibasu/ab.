import { TECHNICAL_ERROR_MESSAGES } from './errors';

/** Console messages grouped by feature. Pass runtime data and error objects separately. */
export const LOG_MESSAGES = {
  startup: {
    preventSplashAutoHideFailed: TECHNICAL_ERROR_MESSAGES.preventSplashAutoHideFailed,
    hideSplashFailed: TECHNICAL_ERROR_MESSAGES.hideSplashFailed,
    rootLayoutFailed: TECHNICAL_ERROR_MESSAGES.rootLayoutFailed,
  },
  auth: {
    emailCooldownSaveFailed: TECHNICAL_ERROR_MESSAGES.emailCooldownSaveFailed,
    providerLoginPressed: (provider: string) => `${provider} login pressed`,
  },
  library: {
    initializationFailed: 'Failed to initialize the library:',
    booksLoadFailed: 'Failed to load books from the local library:',
    bookLoadFailed: 'Failed to load an audiobook from the local library:',
    testResetFailed: 'Failed to clear the test library:',
  },
  bookImport: {
    limitExceeded: 'Import selection exceeds the configured limit:',
    preparationFailed: 'Failed to prepare selected audio files:',
    duplicateZipSkipped: 'Skipped a ZIP whose audio is already present in this account:',
    zipHistoryUnavailable:
      'Could not use ZIP import history; normal duplicate checks remain available:',
    bookSaveFailed: 'Failed to save an imported book:',
    workspaceCleanupFailed: 'Failed to clean up temporary import files:',
    fileMetadataSkipped: 'Skipped an audio file because metadata could not be read:',
    fileCopySkipped: 'Skipped an audio file because it could not be copied:',
    fileComparisonSkipped: 'Skipped an audio file because it could not be checked for duplicates:',
    coverSkipped: 'Skipped an embedded cover because it could not be saved:',
    remoteCoverLookup: 'Searching Open Library for a cover:',
    remoteCoverNotFound: 'No matching cover found on Open Library:',
    remoteCoverMissingMetadata:
      'Skipped Open Library cover lookup because the title or author is missing:',
    remoteCoverSkipped: 'Skipped an Open Library cover because it could not be fetched or saved:',
    remoteCoverCleanupFailed: 'Failed to remove a partial Open Library cover:',
    emptyBookSkipped: 'Skipped a book because no audio files could be saved:',
  },
  audio: {
    metadataRead: (filename: string) => `[${filename}] Metadata:`,
    metadataReadFailed: (filename: string) => `[${filename}] Failed to read metadata:`,
  },
} as const;
