import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';

import { initializeFirebaseAuth } from './firebase-auth.native';
import { firebaseConfig } from './firebaseConfig';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = initializeFirebaseAuth(firebaseApp);

export const register = (email: string, password: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password);

export const login = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(auth, email, password);
