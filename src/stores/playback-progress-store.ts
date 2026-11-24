import { create } from 'zustand';

import {
  savePlaybackProgress,
  type LibraryBook,
  type TrackPlaybackUpdate,
  type PlaybackProgressInput,
} from '@/services/book-repository';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAuthStore } from './auth-store';
import { useLibraryStore } from './library-store';

export type PlaybackCheckpoint = TrackPlaybackUpdate & {
  userId: string;
  bookId: string;
  trackId: string;
  percentProgress: LibraryBook['percentProgress'];
};

type PlaybackProgressState = {
  checkpoints: Record<string, PlaybackCheckpoint>;
  setCheckpoint: (checkpoint: PlaybackCheckpoint) => void;
  getCheckpoint: (userId: string, trackId: string) => PlaybackCheckpoint | undefined;
  removeCheckpoint: (userId: string, trackId: string) => void;
  saveProgress: (progress: PlaybackProgressInput) => Promise<boolean>;
};

const checkpointKey = (userId: string, trackId: string) => JSON.stringify([userId, trackId]);
let saveQueue: Promise<unknown> = Promise.resolve();
let accountVersion = 0;

/** In-memory playback progress only. SQLite is the sole persistent source of progress. */
export const usePlaybackProgressStore = create<PlaybackProgressState>()((set, get) => ({
  checkpoints: {},
  saveProgress: (progress) => {
    const snapshot = { ...progress };
    const version = accountVersion;
    const isActive = () =>
      version === accountVersion && useAuthStore.getState().user?.uid === snapshot.userId;
    const operation = saveQueue.then(async () => {
      if (!isActive()) return false;
      try {
        const saved = await savePlaybackProgress(snapshot, () => {
          if (!isActive()) throw new Error(LOG_MESSAGES.audio.progressSaveFailed);
        });
        if (!saved || !isActive()) return false;
        get().setCheckpoint(saved);
        useLibraryStore.getState().applyPlaybackProgress(saved);
        return true;
      } catch (error) {
        if (isActive()) console.warn(LOG_MESSAGES.audio.progressSaveFailed, error);
        return false;
      }
    });
    saveQueue = operation;
    return operation;
  },
  setCheckpoint: (checkpoint) =>
    set(({ checkpoints }) => ({
      checkpoints: {
        ...checkpoints,
        [checkpointKey(checkpoint.userId, checkpoint.trackId)]: { ...checkpoint },
      },
    })),
  getCheckpoint: (userId, trackId) => get().checkpoints[checkpointKey(userId, trackId)],
  removeCheckpoint: (userId, trackId) => {
    const key = checkpointKey(userId, trackId);
    if (!get().checkpoints[key]) return;

    set(({ checkpoints }) => {
      const remaining = { ...checkpoints };
      delete remaining[key];
      return { checkpoints: remaining };
    });
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.uid === previous.user?.uid) return;
  accountVersion++;
  usePlaybackProgressStore.setState({ checkpoints: {} });
});
