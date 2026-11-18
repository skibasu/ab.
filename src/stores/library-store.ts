import { create } from 'zustand';

import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { enrichBookCover } from '@/services/book-cover-enrichment';
import { deleteBook, getBooks, type LibraryBookWithTracks } from '@/services/book-repository';
import { useAuthStore } from './auth-store';

type LibraryState = {
  books: LibraryBookWithTracks[];
  fetchBooks: (userId: string) => Promise<void>;
  fetchMissingCovers: (userId: string) => void;
  removeBook: (userId: string, bookId: string) => Promise<boolean>;
};

let latestRequest = 0;
const attemptedCoverLookups = new Set<string>();

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
  fetchMissingCovers: (userId) => {
    if (useAuthStore.getState().user?.uid !== userId) return;

    for (const book of get().books) {
      const lookupKey = JSON.stringify([book.id, book.title, book.author]);
      if (book.coverPath !== DEFAULT_BOOK_COVER_PATH || attemptedCoverLookups.has(lookupKey))
        continue;

      attemptedCoverLookups.add(lookupKey);
      void enrichBookCover(book).then((coverPath) => {
        if (!coverPath || useAuthStore.getState().user?.uid !== userId) return;

        set(({ books }) => ({
          books: books.map((item) => (item.id === book.id ? { ...item, coverPath } : item)),
        }));
      });
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
