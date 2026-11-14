import { FirebaseError } from 'firebase/app';

const messages: Record<string, string> = {
  'auth/invalid-credential': 'Check your email and password and try again.',
  'auth/user-not-found': 'Check your email and password and try again.',
  'auth/wrong-password': 'Check your email and password and try again.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
};

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  return error instanceof FirebaseError ? (messages[error.code] ?? fallback) : fallback;
}
