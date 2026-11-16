import { FirebaseError, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

import { APP_ERROR_CODES, TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { initializeFirebaseAuth } from './firebase-auth';
import { firebaseConfig } from './firebaseConfig';
import { saveVerificationEmailCooldown } from './verification-email-cooldown';

let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  return (auth ??= initializeFirebaseAuth(initializeApp(firebaseConfig)));
}

export async function register(email: string, password: string) {
  const auth = getFirebaseAuth();

  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  try {
    await sendEmailVerification(user);
  } catch {
    return { verificationEmailSent: false };
  }

  await saveVerificationEmailCooldown(user.uid);
  return { verificationEmailSent: true };
}

export async function login(email: string, password: string): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  return await signInWithEmailAndPassword(auth, email, password);
}
export const resetPassword = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
};

export const resendVerificationEmail = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new FirebaseError(
      APP_ERROR_CODES.verificationUserMissing,
      TECHNICAL_ERROR_MESSAGES.verificationUserMissing,
    );
  }
  await sendEmailVerification(user);
  await saveVerificationEmailCooldown(user.uid);
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
