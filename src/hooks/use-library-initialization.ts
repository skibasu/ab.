import { useEffect } from 'react';
import { LOG_MESSAGES } from '@/constants/log-messages';

import { initializeLibrary } from '@/services/library-storage';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { runLibraryOperation } from '@/services/library-operation';
import { cleanupImportWorkspaces } from '@/services/zip-import';

export function useLibraryInitialization(): void {
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);

  useEffect(() => {
    if (!userId) return;

    // The operation lock prevents cleanup from touching an import already in progress.
    void runLibraryOperation(async () => cleanupImportWorkspaces()).catch((error) => {
      console.warn(LOG_MESSAGES.bookImport.workspaceCleanupFailed, error);
    });

    try {
      initializeLibrary(userId);
    } catch (error) {
      console.error(LOG_MESSAGES.library.initializationFailed, error);
    }

    void fetchBooks(userId).then(() => useLibraryStore.getState().fetchMissingCovers(userId));
  }, [fetchBooks, userId]);
}
