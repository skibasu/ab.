import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

// Temporary local state until API integration and server-side authentication are implemented.
export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}));
