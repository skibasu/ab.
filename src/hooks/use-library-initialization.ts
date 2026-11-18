import { useEffect } from 'react';
import { LOG_MESSAGES } from '@/constants/log-messages';

import { initializeLibrary } from '@/services/library-storage';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';

export function useLibraryInitialization(): void {
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);

  useEffect(() => {
    if (!userId) return;

    try {
      initializeLibrary(userId);
    } catch (error) {
      console.error(LOG_MESSAGES.library.initializationFailed, error);
    }

    void fetchBooks(userId).then(() => useLibraryStore.getState().fetchMissingCovers(userId));
  }, [fetchBooks, userId]);
}
