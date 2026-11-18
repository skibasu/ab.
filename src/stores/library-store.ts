import { create } from 'zustand';

import { LOG_MESSAGES } from '@/constants/log-messages';
import { deleteBook, getBooks, type LibraryBookWithTracks } from '@/services/book-repository';
import { useAuthStore } from './auth-store';

type LibraryState = {
  books: LibraryBookWithTracks[];
  fetchBooks: (userId: string) => Promise<void>;
  removeBook: (userId: string, bookId: string) => Promise<boolean>;
};

let latestRequest = 0;

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  books: [],
  fetchBooks: async (userId) => {
    if (useAuthStore.getState().user?.uid !== userId) return;

    const request = ++latestRequest;
    try {
      const books = await getBooks(userId);
      if (request === latestRequest) set({ books });
    } catch (error) {
      if (request === latestRequest) console.error(LOG_MESSAGES.library.booksLoadFailed, error);
    }
  },
  removeBook: async (userId, bookId) => {
    if (useAuthStore.getState().user?.uid !== userId) return false;

    const removed = await deleteBook(userId, bookId);
    if (removed) await get().fetchBooks(userId);
    return removed;
  },
}));

useAuthStore.subscribe((state, previousState) => {
  if (state.user?.uid === previousState.user?.uid) return;

  // Invalidate in-flight reads before showing the next account's library.
  latestRequest++;
  useLibraryStore.setState({ books: [] });
});
