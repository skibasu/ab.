import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';

const sourceRoot = new URL('../src/', import.meta.url);
let userId = 'account-a';
const listeners = new Set();
const applied = [];
let persistProgress = async (snapshot, assertActive) => {
  assertActive();
  return { ...snapshot, percentProgress: 42.5 };
};
globalThis.__progressMocks = {
  savePlaybackProgress: (...args) => persistProgress(...args),
  useAuthStore: {
    getState: () => ({ user: { uid: userId } }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  },
  useLibraryStore: {
    getState: () => ({ applyPlaybackProgress: (progress) => applied.push(progress) }),
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const mocks = {
      '@/services/book-repository': 'savePlaybackProgress',
      './auth-store': 'useAuthStore',
      './library-store': 'useLibraryStore',
    };
    if (mocks[specifier])
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(`export const {${mocks[specifier]}}=globalThis.__progressMocks;`)}`,
      };
    if (specifier.startsWith('@/'))
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot.href)) {
      const target = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(target)) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { usePlaybackProgressStore: store } =
  await import('../src/stores/playback-progress-store.ts');

const checkpoint = {
  userId: 'account-a',
  bookId: 'book-a',
  trackId: 'track-a',
  positionSeconds: 125.5,
  completed: false,
  lastPlayedAt: 1000,
  updatedAt: 1100,
  percentProgress: 42.5,
};

test('in-memory progress remains isolated by user and track', () => {
  const second = { ...checkpoint, userId: 'account-b', percentProgress: 80 };
  const anotherTrack = { ...checkpoint, trackId: 'track-b', positionSeconds: 15 };
  store.getState().setCheckpoint(checkpoint);
  store.getState().setCheckpoint(second);
  store.getState().setCheckpoint(anotherTrack);
  assert.deepEqual(store.getState().getCheckpoint('account-a', 'track-a'), checkpoint);
  assert.deepEqual(store.getState().getCheckpoint('account-b', 'track-a'), second);
  assert.deepEqual(store.getState().getCheckpoint('account-a', 'track-b'), anotherTrack);

  store.getState().removeCheckpoint('account-a', 'track-a');
  assert.equal(store.getState().getCheckpoint('account-a', 'track-a'), undefined);
  assert.deepEqual(store.getState().getCheckpoint('account-b', 'track-a'), second);
  assert.deepEqual(store.getState().getCheckpoint('account-a', 'track-b'), anotherTrack);
});

test('a fresh store starts empty instead of restoring playback progress from storage', async () => {
  store.getState().setCheckpoint(checkpoint);
  const { usePlaybackProgressStore: fresh } =
    await import('../src/stores/playback-progress-store.ts?fresh');
  assert.deepEqual(fresh.getState().checkpoints, {});
  assert.equal(fresh.getState().getCheckpoint('account-a', 'track-a'), undefined);
  assert.equal('persist' in fresh, false);
});

test('progress writes are serialized and Zustand changes only after the database succeeds', async () => {
  store.setState({ checkpoints: {} });
  applied.length = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const positions = [];
  persistProgress = async (snapshot, assertActive) => {
    positions.push(snapshot.positionSeconds);
    if (positions.length === 1) await gate;
    assertActive();
    return { ...snapshot, percentProgress: snapshot.positionSeconds };
  };
  const first = store.getState().saveProgress({ ...checkpoint, positionSeconds: 15 });
  const second = store.getState().saveProgress({ ...checkpoint, positionSeconds: 30 });
  await Promise.resolve();
  assert.deepEqual(positions, [15]);
  assert.equal(store.getState().getCheckpoint('account-a', 'track-a'), undefined);
  assert.equal(applied.length, 0);
  release();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.deepEqual(positions, [15, 30]);
  assert.equal(store.getState().getCheckpoint('account-a', 'track-a').positionSeconds, 30);
  assert.equal(applied.at(-1).percentProgress, 30);
});

test('database failures leave the last successful Zustand snapshot unchanged', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const before = store.getState().getCheckpoint('account-a', 'track-a');
  persistProgress = async () => {
    throw new Error('Simulated database failure');
  };
  assert.equal(await store.getState().saveProgress({ ...checkpoint, positionSeconds: 90 }), false);
  assert.deepEqual(store.getState().getCheckpoint('account-a', 'track-a'), before);
});

test('account changes invalidate queued and in-flight saves and clear transient progress', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  persistProgress = async (snapshot, assertActive) => {
    await gate;
    assertActive();
    return snapshot;
  };
  const pending = store.getState().saveProgress(checkpoint);
  const queued = store.getState().saveProgress({ ...checkpoint, positionSeconds: 90 });
  await Promise.resolve();
  userId = 'account-b';
  for (const listener of listeners)
    listener({ user: { uid: 'account-b' } }, { user: { uid: 'account-a' } });
  release();
  assert.equal(await pending, false);
  assert.equal(await queued, false);
  assert.deepEqual(store.getState().checkpoints, {});
});
