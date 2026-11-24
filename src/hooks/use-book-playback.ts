import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { LOG_MESSAGES } from '@/constants/log-messages';
import type { LibraryBookWithTracks, LibraryTrack } from '@/services/book-repository';
import { PlaybackSession } from '@/services/playback-session';
import { usePlaybackProgressStore } from '@/stores/playback-progress-store';

export function useBookPlayback(book: LibraryBookWithTracks | null) {
  // No source in the hook dependencies: progress writes and rerenders cannot recreate the player.
  const player = useAudioPlayer(null);
  const [selection, setSelection] = useState<{ track: LibraryTrack; ready: boolean }>();
  const session = useMemo(
    () =>
      book
        ? new PlaybackSession({
            player,
            book,
            source: (track) => ({ uri: new File(Paths.document, track.filePath).uri }),
            save: (snapshot) => usePlaybackProgressStore.getState().saveProgress(snapshot),
            getProgress: (trackId) =>
              usePlaybackProgressStore.getState().getCheckpoint(book.userId, trackId),
            onChange: (track, ready) => setSelection({ track, ready }),
            onError: (error) => console.warn(LOG_MESSAGES.audio.playbackFailed, error),
          })
        : null,
    [book, player],
  );

  useEffect(() => {
    if (!session || !book) return;
    let active = true;
    const subscription = player.addListener('playbackStatusUpdate', (update) =>
      session.handleStatus(update),
    );
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void session.flush();
    });
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => {
        if (!active) return;
        player.setActiveForLockScreen(true, { title: book.title, artist: book.author });
        session.start();
      })
      .catch((error) => console.warn(LOG_MESSAGES.audio.playbackFailed, error));
    return () => {
      active = false;
      subscription.remove();
      appState.remove();
      session.dispose();
      try {
        player.setActiveForLockScreen(false);
        player.replace(null);
      } catch {
        // The provider may already have released the native player on unmount.
      }
    };
  }, [session, player, book]);

  const togglePlay = useCallback(() => session?.togglePlay(), [session]);
  const resumeOnOpen = useCallback(() => {
    void session?.resumeOnOpen();
  }, [session]);
  const next = useCallback(() => {
    void session?.skip(15);
  }, [session]);
  const back = useCallback(() => {
    void session?.skip(-15);
  }, [session]);
  const selectTrack = useCallback(
    (track: LibraryTrack) => {
      void session?.selectTrack(track);
    },
    [session],
  );

  return {
    track: book?.tracks.some((track) => track.id === selection?.track.id)
      ? selection?.track
      : undefined,
    ready: selection?.ready ?? false,
    player,
    togglePlay,
    resumeOnOpen,
    next,
    back,
    selectTrack,
  };
}

export type BookPlayback = ReturnType<typeof useBookPlayback>;
