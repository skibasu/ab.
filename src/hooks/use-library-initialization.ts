import { useEffect } from 'react';
import { LOG_MESSAGES } from '@/constants/log-messages';

import { initializeLibrary } from '@/services/library-storage';
import { useAuthStore } from '@/stores/auth-store';

export function useLibraryInitialization(): void {
  const userId = useAuthStore((state) => state.user?.uid);

  useEffect(() => {
    if (!userId) return;

    try {
      initializeLibrary(userId);
    } catch (error) {
      console.error(LOG_MESSAGES.library.initializationFailed, error);
    }
  }, [userId]);
}
