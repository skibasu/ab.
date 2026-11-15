import { isRunningInExpoGo } from 'expo';
import { FirebaseError } from 'firebase/app';

import { APP_ERROR_CODES, TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { loginWithGoogle } from './firebase';

export async function signInWithGoogle() {
  if (isRunningInExpoGo()) {
    throw new FirebaseError(
      APP_ERROR_CODES.googleSignInBuildRequired,
      TECHNICAL_ERROR_MESSAGES.googleSignInBuildRequired,
    );
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new FirebaseError(
      APP_ERROR_CODES.googleSignInNotConfigured,
      TECHNICAL_ERROR_MESSAGES.googleSignInNotConfigured,
    );
  }

  const { GoogleSignin, isSuccessResponse } =
    await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return;

  const { idToken } = result.data;
  if (!idToken) {
    throw new FirebaseError(
      APP_ERROR_CODES.googleSignInNoToken,
      TECHNICAL_ERROR_MESSAGES.googleSignInNoToken,
    );
  }

  await loginWithGoogle(idToken);
}
