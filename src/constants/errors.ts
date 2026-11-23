export const APP_ERROR_CODES = {
  emailNotVerified: 'auth/email-not-verified',
  emailAlreadyInUse: 'auth/email-already-in-use',
  googleSignInBuildRequired: 'app/google-sign-in-build-required',
  googleSignInNotConfigured: 'app/google-sign-in-not-configured',
  googleSignInNoToken: 'app/google-sign-in-no-token',
  verificationUserMissing: 'app/verification-user-missing',
  passwordResetCooldown: 'app/password-reset-cooldown',
  importFailed: 'import/failed',
  importFileReadFailed: 'import/file-read-failed',
  importFileSaveFailed: 'import/file-save-failed',
  importCancelled: 'import/cancelled',
  importLimitExceeded: 'import/limit-exceeded',
  importInvalidZip: 'import/invalid-zip',
  importEncryptedZip: 'import/encrypted-zip',
  importUnsupportedZip: 'import/unsupported-zip',
  importNoAudio: 'import/no-audio',
  importNoSpace: 'import/no-space',
  importCleanupFailed: 'import/cleanup-failed',
  importNativeBuildRequired: 'import/native-build-required',
} as const;

/** Technical import failures. UI messages are kept separate from these error codes. */
export const BOOK_IMPORT_ERROR_MESSAGES = {
  [APP_ERROR_CODES.importFailed]: 'Could not finish the selected file import.',
  [APP_ERROR_CODES.importFileReadFailed]: 'Some audio files could not be read or compared.',
  [APP_ERROR_CODES.importFileSaveFailed]: 'Some audio files could not be saved.',
  [APP_ERROR_CODES.importCancelled]: 'The import was cancelled before it could finish.',
  [APP_ERROR_CODES.importLimitExceeded]: 'The selected files exceed an import or buffer limit.',
  [APP_ERROR_CODES.importInvalidZip]: 'The ZIP archive is damaged or contains unsafe entries.',
  [APP_ERROR_CODES.importEncryptedZip]: 'Encrypted ZIP archives are not supported.',
  [APP_ERROR_CODES.importUnsupportedZip]: 'The ZIP archive uses an unsupported compression method.',
  [APP_ERROR_CODES.importNoAudio]: 'The selected files contain no readable MP3 audio.',
  [APP_ERROR_CODES.importNoSpace]: 'There is not enough free space to prepare and save the import.',
  [APP_ERROR_CODES.importCleanupFailed]: 'Could not remove all temporary import files.',
  [APP_ERROR_CODES.importNativeBuildRequired]:
    'Native ZIP import requires a new iOS development build.',
} as const;

export const AUTH_ERROR_MESSAGES = {
  googleSignInBuildRequired: 'Google Sign-In requires an iOS development build.',
  googleSignInNotConfigured: 'Google Sign-In is not configured for this build.',
  useOriginalSignInMethod: 'Sign in using your original sign-in method.',
  emailNotVerified: 'Verify your email before signing in.',
  emailAlreadyInUse: 'An account with this email already exists. Try signing in.',
  invalidEmailCredentials: 'Check your email and password and try again.',
  networkRequestFailed: 'Check your internet connection and try again.',
  tooManyRequests: 'Too many attempts. Try again later.',
  verificationEmailFailed: 'Account created, but the verification email could not be sent.',
  verificationUserMissing: 'Sign in again to resend the verification email.',
  verificationResendCooldown: (seconds: number) =>
    `Please wait ${Math.floor(seconds / 60)} min ${seconds % 60} s before requesting another verification email.`,
  passwordResetCooldown: (seconds: number) =>
    `Please wait ${Math.floor(seconds / 60)} min ${seconds % 60} s before requesting another password reset email.`,
} as const;

export const AUTH_ACTION_ERROR_MESSAGES = {
  login: 'Could not sign in. Try again.',
  googleSignIn: 'Could not sign in with Google. Try again.',
  register: 'Could not create your account. Try again.',
  logout: 'Could not log out. Try again.',
  reset: 'Could not reset your password. Try again.',
  verificationLinkResend: 'Could not resend the verification email. Try again.',
} as const;

export const STARTUP_ERROR_MESSAGE = 'Could not start the app. Reopen it and try again.';

export const TECHNICAL_ERROR_MESSAGES = {
  formProviderMissing: 'useFormContext must be used within a FormProvider',
  emailNotVerified: 'Firebase user email is not verified.',
  googleSignInBuildRequired: 'Google Sign-In is unavailable in Expo Go.',
  googleSignInNotConfigured: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing.',
  googleSignInNoToken: 'Google returned no ID token.',
  firebaseAuthInitializationFailed: 'Firebase Auth initialization failed.',
  registrationCleanupFailed: 'Failed to delete the temporary Firebase registration app.',
  fontLoadingFailed: 'Failed to load app fonts.',
  preventSplashAutoHideFailed: 'Failed to prevent the splash screen from hiding automatically.',
  hideSplashFailed: 'Failed to hide the splash screen.',
  rootLayoutFailed: 'Expo Router root layout failed.',
  verificationUserMissing:
    'An authenticated Firebase user is required to resend the verification email.',
  emailCooldownSaveFailed: 'Failed to save the email resend cooldown.',
  passwordResetCooldown: 'The password reset email cooldown is still active.',
} as const;

/** Technical audio errors; these messages are not intended for display in the UI. */
export const AUDIO_ERROR_MESSAGES = {
  fileSizeUnavailable: 'Could not determine the audio file size.',
  readerClosed: 'The audio file reader is closed.',
  invalidReadPosition: 'The read position must be a non-negative safe integer.',
  invalidReadLength: 'The read length must be a non-negative safe integer.',
  tokenizerClosed: 'The audio file tokenizer is closed.',
  localFileUnavailable: 'Could not resolve the local MP3 file.',
} as const;

/** Technical errors raised while preparing or writing the local book library. */
export const LIBRARY_ERROR_MESSAGES = {
  operationInProgress: 'Wait for the current library operation to finish and try again.',
  testResetFailed: 'Could not clear the test library. Try again.',
  invalidUserId: 'A valid user ID is required to save book files.',
  emptyBook: 'A book must contain at least one audio file.',
  bookUnavailable: 'The book is no longer available in the local library.',
  remoteCoverRequestFailed: (status: number) => `Open Library returned HTTP ${status}.`,
  trackDestinationExists: 'The generated audio file already exists.',
  saveAndCleanupFailed: 'Failed to save book files and clean up the new files.',
  unsupportedDatabaseVersion: 'Could not read a supported library database schema version.',
  databaseSaveAndCleanupFailed: 'Failed to save the book to the database and remove its new files.',
} as const;
