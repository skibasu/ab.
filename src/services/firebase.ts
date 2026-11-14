import { firebaseConfig } from '@/services/firebaseConfig';
import { initializeApp } from 'firebase/app';

export const firebaseApp = initializeApp(firebaseConfig);
