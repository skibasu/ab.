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
  },
  bookImport: {
    filesSelected: 'Selected audio files:',
    metadataRead: 'Audio files with metadata:',
    filesGrouped: 'Grouped files:',
    preparationFailed: 'Failed to prepare selected audio files:',
    fileMetadataSkipped: 'Skipped an audio file because metadata could not be read:',
    fileCopySkipped: 'Skipped an audio file because it could not be copied:',
    coverSkipped: 'Skipped an embedded cover because it could not be saved:',
    emptyBookSkipped: 'Skipped a book because no audio files could be saved:',
    bookSaved: 'Saved book files:',
  },
  audio: {
    metadataRead: (filename: string) => `[${filename}] Metadata:`,
    metadataReadFailed: (filename: string) => `[${filename}] Failed to read metadata:`,
  },
} as const;
