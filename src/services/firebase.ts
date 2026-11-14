import { deleteApp, FirebaseError, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  initializeAuth,
  inMemoryPersistence,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type UserCredential,
} from 'firebase/auth';

import { initializeFirebaseAuth } from './firebase-auth.native';
import { firebaseConfig } from './firebaseConfig';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = initializeFirebaseAuth(firebaseApp);

let registrationAttempt = 0;

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
    await deleteApp(app);
  }
}

export async function login(email: string, password: string): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (!credential.user.emailVerified) {
    await signOut(auth);
    throw new FirebaseError('auth/email-not-verified', 'Verify your email before signing in.');
  }

  return credential;
}

export const logout = (): Promise<void> => signOut(auth);
