import { useEffect } from 'react';

import { initializeLibrary } from '@/services/library-storage';
import { useAuthStore } from '@/stores/auth-store';

export function useLibraryInitialization(): void {
  const userId = useAuthStore((state) => state.user?.uid);

  useEffect(() => {
    if (!userId) return;

    try {
      initializeLibrary(userId);
    } catch (error) {
      console.error('Failed to initialize the library:', error);
    }
  }, [userId]);
}
