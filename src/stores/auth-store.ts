import type { User } from 'firebase/auth';
import { create } from 'zustand';

export type AuthUser = Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL' | 'emailVerified'>;

type AuthState = {
  user: AuthUser | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
};

// Firebase persists the session. This store only mirrors the user profile for the UI.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthReady: false,
  setUser: (user) =>
    set({
      user: user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
          }
        : null,
      isAuthReady: true,
    }),
}));
