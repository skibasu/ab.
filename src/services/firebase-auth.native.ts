import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, type FirebaseApp } from 'firebase/app';
// @ts-expect-error Firebase 13 omits this React Native export from its shared typings.
import { AuthErrorCodes, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

export function initializeFirebaseAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === AuthErrorCodes.ALREADY_INITIALIZED) {
      return getAuth(app);
    }
    throw error;
  }
}
