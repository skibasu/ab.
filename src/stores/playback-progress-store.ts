import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TrackPlaybackUpdate } from '@/services/book-repository';

export type PlaybackCheckpoint = TrackPlaybackUpdate & {
  userId: string;
  bookId: string;
  trackId: string;
};

type PlaybackProgressState = {
  checkpoints: Record<string, PlaybackCheckpoint>;
  setCheckpoint: (checkpoint: PlaybackCheckpoint) => void;
  getCheckpoint: (userId: string, trackId: string) => PlaybackCheckpoint | undefined;
  removeCheckpoint: (userId: string, trackId: string) => void;
};

const checkpointKey = (userId: string, trackId: string) => JSON.stringify([userId, trackId]);

/** Durable playback checkpoints only. Scheduling and SQLite synchronization live outside this store. */
export const usePlaybackProgressStore = create<PlaybackProgressState>()(
  persist(
    (set, get) => ({
      checkpoints: {},
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
    }),
    {
      name: 'ab-playback-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ checkpoints }) => ({ checkpoints }),
    },
  ),
);
