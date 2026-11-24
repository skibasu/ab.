import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { useBookPlayback, type BookPlayback } from '@/hooks/use-book-playback';
import { useLibraryBook } from '@/hooks/use-library-book';
import type { LibraryBookWithTracks } from '@/services/book-repository';
import { useAuthStore } from '@/stores/auth-store';

type PlaybackContextValue = {
  bookId: string | undefined;
  book: LibraryBookWithTracks | null;
  isLoading: boolean;
  failed: boolean;
  openBook: (bookId: string) => void;
  playback: BookPlayback;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

function PlaybackOwner({ children, userId }: PropsWithChildren<{ userId?: string }>) {
  const [bookId, setBookId] = useState<string>();
  const { book, isLoading, failed } = useLibraryBook(userId, bookId);
  // This hook belongs to the provider, so removing a screen does not dispose the session.
  const playback = useBookPlayback(book);
  const { resumeOnOpen } = playback;
  const openBook = useCallback(
    (id: string) => {
      if (id === bookId) {
        resumeOnOpen();
      } else {
        setBookId(id);
      }
    },
    [bookId, resumeOnOpen],
  );
  const value = useMemo(
    () => ({ bookId, book, isLoading, failed, openBook, playback }),
    [bookId, book, isLoading, failed, openBook, playback],
  );

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function PlaybackProvider({ children }: PropsWithChildren) {
  const userId = useAuthStore((state) => state.user?.uid);

  return (
    <PlaybackOwner
      key={userId ?? 'signed-out'}
      userId={userId}
    >
      {children}
    </PlaybackOwner>
  );
}

export function usePlaybackContext() {
  const context = useContext(PlaybackContext);
  if (context === null) throw new Error(TECHNICAL_ERROR_MESSAGES.playbackProviderMissing);
  return context;
}
