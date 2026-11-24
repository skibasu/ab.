import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';

const storageKey = 'ab-playback-progress';
const checkpointKey = (userId, trackId) => JSON.stringify([userId, trackId]);
const previousCheckpoint = {
  userId: 'account-a',
  bookId: 'book-a',
  trackId: 'track-a',
  positionSeconds: 125.5,
  completed: false,
  lastPlayedAt: 1000,
  updatedAt: 1100,
};
const stored = new Map([
  [
    storageKey,
    JSON.stringify({
      version: 1,
      state: { checkpoints: { [checkpointKey('account-a', 'track-a')]: previousCheckpoint } },
    }),
  ],
]);

globalThis.__playbackStorageMock = {
  async getItem(key) {
    return stored.get(key) ?? null;
  },
  async setItem(key, value) {
    stored.set(key, value);
  },
  async removeItem(key) {
    stored.delete(key);
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export default globalThis.__playbackStorageMock;',
      };
    }
    return nextResolve(specifier, context);
  },
});

const { usePlaybackProgressStore: store } =
  await import('../src/stores/playback-progress-store.ts');

test('version 1 checkpoints gain book progress without losing the saved track position', async () => {
  await store.persist.rehydrate();
  assert.equal(store.persist.hasHydrated(), true);
  assert.deepEqual(store.getState().getCheckpoint('account-a', 'track-a'), {
    ...previousCheckpoint,
    percentProgress: 0,
  });
  assert.equal(JSON.parse(stored.get(storageKey)).version, 2);
});

test('book percentage persists, survives reload and remains isolated by user and track', async () => {
  const first = { ...previousCheckpoint, percentProgress: 42.5 };
  const second = { ...first, userId: 'account-b', percentProgress: 80 };
  store.getState().setCheckpoint(first);
  store.getState().setCheckpoint(second);
  const saved = JSON.parse(stored.get(storageKey));
  assert.deepEqual(Object.keys(saved.state), ['checkpoints']);
  assert.deepEqual(saved.state.checkpoints[checkpointKey('account-a', 'track-a')], first);
  assert.deepEqual(saved.state.checkpoints[checkpointKey('account-b', 'track-a')], second);

  const { usePlaybackProgressStore: restored } =
    await import('../src/stores/playback-progress-store.ts?reload');
  await restored.persist.rehydrate();
  assert.deepEqual(restored.getState().getCheckpoint('account-a', 'track-a'), first);
  assert.deepEqual(restored.getState().getCheckpoint('account-b', 'track-a'), second);
  restored.getState().removeCheckpoint('account-a', 'track-a');
  assert.equal(restored.getState().getCheckpoint('account-a', 'track-a'), undefined);
  assert.deepEqual(restored.getState().getCheckpoint('account-b', 'track-a'), second);
  assert.equal(
    JSON.parse(stored.get(storageKey)).state.checkpoints[checkpointKey('account-a', 'track-a')],
    undefined,
  );
});
