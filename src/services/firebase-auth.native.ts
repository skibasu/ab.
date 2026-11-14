import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError, type FirebaseApp } from 'firebase/app';
// @ts-expect-error Firebase 13 omits this React Native export from its shared typings.
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const persistence = getReactNativePersistence(AsyncStorage);

export function initializeFirebaseAuth(app: FirebaseApp) {
  try {
    return initializeAuth(app, { persistence });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
}
