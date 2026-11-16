export const APP_ERROR_CODES = {
  emailNotVerified: 'auth/email-not-verified',
  emailAlreadyInUse: 'auth/email-already-in-use',
  googleSignInBuildRequired: 'app/google-sign-in-build-required',
  googleSignInNotConfigured: 'app/google-sign-in-not-configured',
  googleSignInNoToken: 'app/google-sign-in-no-token',
  verificationUserMissing: 'app/verification-user-missing',
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
  verificationCooldownSaveFailed: 'Failed to save the verification email resend cooldown.',
} as const;
