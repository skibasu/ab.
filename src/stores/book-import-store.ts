import { create } from 'zustand';

import type {
  BookImportUpdate,
  ImportBookPreview,
  ImportStage,
} from '@/services/book-import.types';
import { useAuthStore } from './auth-store';

type ActiveImport = {
  id: string;
  userId: string;
  stage: ImportStage;
  progress: number;
  previews: ImportBookPreview[];
};
type BookImportState = {
  activeImport: ActiveImport | null;
  startImport: (id: string, userId: string, title: string) => void;
  updateImport: (id: string, update: BookImportUpdate) => void;
  clearImport: (id: string) => void;
};

/** Transient UI state only. Audio, controllers and saved library records live outside this store. */
export const useBookImportStore = create<BookImportState>()((set) => ({
  activeImport: null,
  startImport: (id, userId, title) => {
    if (useAuthStore.getState().user?.uid !== userId) return;
    set({
      activeImport: {
        id,
        userId,
        stage: 'preparing',
        progress: 0,
        previews: [{ key: 'pending', title, author: '', coverUri: null }],
      },
    });
  },
  updateImport: (id, update) =>
    set(({ activeImport }) => {
      if (
        !activeImport ||
        activeImport.id !== id ||
        useAuthStore.getState().user?.uid !== activeImport.userId
      )
        return {};
      const progress = Number.isFinite(update.progress)
        ? Math.max(activeImport.progress, Math.min(100, update.progress!))
        : activeImport.progress;
      return { activeImport: { ...activeImport, ...update, progress } };
    }),
  clearImport: (id) =>
    set(({ activeImport }) => (activeImport?.id === id ? { activeImport: null } : {})),
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid !== previous.user?.uid) useBookImportStore.setState({ activeImport: null });
});
