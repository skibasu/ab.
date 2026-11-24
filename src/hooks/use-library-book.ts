import { useEffect, useState } from 'react';

import { LOG_MESSAGES } from '@/constants/log-messages';
import { getBook, type LibraryBookWithTracks } from '@/services/book-repository';

type BookResult = {
  userId: string;
  bookId: string;
  book: LibraryBookWithTracks | null;
  failed: boolean;
};

/** Loads tracks only for the opened book and ignores results after navigation or account changes. */
export function useLibraryBook(userId?: string, bookId?: string) {
  const [result, setResult] = useState<BookResult>();

  useEffect(() => {
    if (!userId || !bookId) return;
    let active = true;

    void getBook(userId, bookId).then(
      (book) => {
        if (active) setResult({ userId, bookId, book, failed: false });
      },
      (error) => {
        if (!active) return;
        console.error(LOG_MESSAGES.library.bookLoadFailed, error);
        setResult({ userId, bookId, book: null, failed: true });
      },
    );

    return () => {
      active = false;
    };
  }, [userId, bookId]);

  const current =
    userId && bookId && result?.userId === userId && result.bookId === bookId ? result : undefined;

  return {
    book: current?.book ?? null,
    isLoading: Boolean(userId && bookId && !current),
    failed: current?.failed ?? false,
  };
}
