import { isRunningInExpoGo } from 'expo';
import { FirebaseError } from 'firebase/app';

import { loginWithGoogle } from './firebase';

export async function signInWithGoogle() {
  if (isRunningInExpoGo()) {
    throw new FirebaseError(
      'app/google-sign-in-build-required',
      'Google Sign-In requires a build.',
    );
  }

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new FirebaseError(
      'app/google-sign-in-not-configured',
      'Google Web Client ID is missing.',
    );
  }

  const { GoogleSignin, isSuccessResponse } =
    await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return;

  const { idToken } = result.data;
  if (!idToken) {
    throw new FirebaseError('app/google-sign-in-no-token', 'Google returned no ID token.');
  }

  await loginWithGoogle(idToken);
}
