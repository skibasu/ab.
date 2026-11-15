import { FirebaseError } from 'firebase/app';
import { AuthErrorCodes } from 'firebase/auth';

import {
  APP_ERROR_CODES,
  AUTH_ACTION_ERROR_MESSAGES,
  AUTH_ERROR_MESSAGES,
} from '@/constants/errors';

const messages: Partial<Record<string, string>> = {
  [APP_ERROR_CODES.googleSignInBuildRequired]: AUTH_ERROR_MESSAGES.googleSignInBuildRequired,
  [APP_ERROR_CODES.googleSignInNotConfigured]: AUTH_ERROR_MESSAGES.googleSignInNotConfigured,
  [APP_ERROR_CODES.emailNotVerified]: AUTH_ERROR_MESSAGES.emailNotVerified,
  [AuthErrorCodes.NEED_CONFIRMATION]: AUTH_ERROR_MESSAGES.useOriginalSignInMethod,
  [AuthErrorCodes.NETWORK_REQUEST_FAILED]: AUTH_ERROR_MESSAGES.networkRequestFailed,
  [AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER]: AUTH_ERROR_MESSAGES.tooManyRequests,
};

const emailLoginErrorCodes: ReadonlySet<string> = new Set([
  AuthErrorCodes.INVALID_LOGIN_CREDENTIALS,
  AuthErrorCodes.USER_DELETED,
  AuthErrorCodes.INVALID_PASSWORD,
]);

export function getAuthErrorMessage(
  error: unknown,
  action: keyof typeof AUTH_ACTION_ERROR_MESSAGES,
): string {
  const fallback = AUTH_ACTION_ERROR_MESSAGES[action];
  if (!(error instanceof FirebaseError)) return fallback;

  if (action === 'login' && emailLoginErrorCodes.has(error.code)) {
    return AUTH_ERROR_MESSAGES.invalidEmailCredentials;
  }

  return messages[error.code] ?? fallback;
}
