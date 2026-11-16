import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  initializeAuth,
  inMemoryPersistence,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

import { TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { initializeFirebaseAuth } from './firebase-auth';
import { firebaseConfig } from './firebaseConfig';

let auth: Auth | undefined;
let registrationAttempt = 0;

export function getFirebaseAuth(): Auth {
  return (auth ??= initializeFirebaseAuth(initializeApp(firebaseConfig)));
}

export async function register(email: string, password: string) {
  // Firebase signs in new accounts automatically. Keep that sign-in separate from the app session.
  const app = initializeApp(firebaseConfig, `registration-${++registrationAttempt}`);
  try {
    const registrationAuth = initializeAuth(app, { persistence: inMemoryPersistence });
    const { user } = await createUserWithEmailAndPassword(registrationAuth, email, password);

    try {
      await sendEmailVerification(user);
      return { verificationEmailSent: true };
    } catch {
      return { verificationEmailSent: false };
    }
  } finally {
    try {
      await deleteApp(app);
    } catch (error) {
      console.error(TECHNICAL_ERROR_MESSAGES.registrationCleanupFailed, error);
    }
  }
}

export async function login(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return requireVerifiedEmail(auth, await signInWithEmailAndPassword(auth, email, password));
}
export const resetPassword = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
};

export async function loginWithGoogle(idToken: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  const googleCredential = GoogleAuthProvider.credential(idToken);
  return requireVerifiedEmail(auth, await signInWithCredential(auth, googleCredential));
}

async function requireVerifiedEmail(
  auth: Auth,
  credential: UserCredential,
): Promise<UserCredential> {
  if (!credential.user.emailVerified) {
    await signOut(auth);
    //  throw new FirebaseError(
    //    APP_ERROR_CODES.emailNotVerified,
    //    TECHNICAL_ERROR_MESSAGES.emailNotVerified,
    //  );
  }

  return credential;
}

export async function logout(): Promise<void> {
  await signOut(getFirebaseAuth());
}
