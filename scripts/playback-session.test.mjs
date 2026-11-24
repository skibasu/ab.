import assert from 'node:assert/strict';
import test from 'node:test';
import { PlaybackSession } from '../src/services/playback-session.ts';

const tick = () => new Promise(setImmediate);
function setup({ positionSeconds = 0, saveResult = true, getProgress = () => undefined } = {}) {
  const writes = [];
  const replacements = [];
  const changes = [];
  const tracks = [0, 1].map((position) => ({
    id: `track-${position}`,
    title: 'Part',
    filePath: `part${position}.mp3`,
    duration: 100,
    position,
    positionSeconds: position === 0 ? positionSeconds : 0,
    completed: false,
    lastPlayedAt: null,
    updatedAt: null,
  }));
  const player = {
    currentTime: 0,
    duration: 100,
    playing: false,
    replace(source) {
      replacements.push(source);
      this.currentTime = 0;
    },
    play() {
      this.playing = true;
    },
    pause() {
      this.playing = false;
    },
    async seekTo(position) {
      this.currentTime = position;
    },
  };
  const book = { id: 'book', userId: 'user', lastPlayedTrackId: 'track-0', tracks };
  const session = new PlaybackSession({
    player,
    book,
    source: (track) => ({ uri: track.filePath }),
    getProgress,
    save: async (snapshot) => {
      writes.push(snapshot);
      return saveResult;
    },
    onChange: (track, ready) => changes.push({ track, ready }),
    onError: (error) => {
      throw error;
    },
  });
  const status = (position, overrides = {}) => {
    player.currentTime = position;
    if ('playing' in overrides) player.playing = overrides.playing;
    session.handleStatus({
      isLoaded: true,
      currentTime: position,
      duration: 100,
      playing: player.playing,
      didJustFinish: false,
      ...overrides,
    });
  };
  const ready = async () => {
    status(0);
    await tick();
  };
  session.start();
  return { session, player, writes, replacements, changes, status, ready, tracks };
}

test('restores saved position once with a 15-second rewind, clamped to zero', async () => {
  for (const [positionSeconds, expected] of [
    [0, 0],
    [10, 0],
    [15, 0],
    [60, 45],
  ]) {
    const s = setup({ positionSeconds });
    await s.ready();
    assert.equal(s.player.currentTime, expected);
    assert.equal(s.player.playing, true);
    assert.equal(s.writes.length, 1);
    assert.equal(s.writes.at(-1).positionSeconds, expected);
    s.status(expected + 1);
    assert.equal(s.replacements.length, 1);
    s.session.dispose();
  }
});

test('play, pause, skips and periodic checkpoints save without replacing the audio source', async () => {
  const s = setup();
  await s.ready();
  await tick();
  assert.equal(s.writes.length, 1);
  s.status(14);
  await tick();
  assert.equal(s.writes.length, 1);
  s.status(15);
  await tick();
  assert.equal(s.writes.at(-1).positionSeconds, 15);
  s.status(20);
  s.session.togglePlay();
  await tick();
  assert.equal(s.writes.at(-1).positionSeconds, 20);
  await s.session.skip(15);
  assert.equal(s.writes.at(-1).positionSeconds, 35);
  await s.session.skip(-15);
  assert.equal(s.writes.at(-1).positionSeconds, 20);
  await s.session.skip(-100);
  assert.equal(s.writes.at(-1).positionSeconds, 0);
  await s.session.skip(200);
  assert.equal(s.writes.at(-1).positionSeconds, 100);
  assert.equal(s.replacements.length, 1);
});

test('selecting a later track saves and completes the previous track before loading the next', async () => {
  const s = setup();
  await s.ready();
  s.status(35);
  await s.session.selectTrack(s.tracks[1]);
  assert.equal(s.writes.at(-1).trackId, 'track-0');
  assert.equal(s.writes.at(-1).positionSeconds, 35);
  assert.equal(s.writes.at(-1).completed, true);
  assert.equal(s.replacements.length, 2);
  await s.ready();
  assert.equal(s.player.playing, true);
  await s.session.selectTrack(s.tracks[0]);
  assert.equal(s.writes.at(-1).trackId, 'track-1');
  assert.equal(s.writes.at(-1).completed, false);
});

test('natural completion saves the ending position and advances to the next track', async () => {
  const s = setup();
  await s.ready();
  s.status(100, { playing: false, didJustFinish: true });
  await tick();
  assert.equal(s.writes.at(-1).completed, true);
  assert.equal(s.writes.at(-1).positionSeconds, 100);
  assert.equal(s.changes.at(-1).track.id, 'track-1');
  await s.ready();
  assert.equal(s.player.playing, true);
});

test('failed periodic writes do not advance the saved-position baseline', async () => {
  const s = setup({ saveResult: false });
  await s.ready();
  s.status(15);
  await tick();
  const count = s.writes.length;
  s.status(16);
  await tick();
  assert.equal(s.writes.length, count + 1);
  assert.equal(s.writes.at(-1).positionSeconds, 16);
});

test('background flush and disposal save progress and stop processing after disposal', async () => {
  const s = setup();
  await s.ready();
  await s.session.flush();
  assert.equal(s.writes.length, 2);
  s.status(8);
  await s.session.flush();
  assert.equal(s.writes.at(-1).positionSeconds, 8);
  s.status(9);
  s.session.dispose();
  await tick();
  assert.equal(s.writes.at(-1).positionSeconds, 9);
  const count = s.writes.length;
  s.status(30);
  await tick();
  assert.equal(s.writes.length, count);
});

test('play restarts the final track after natural completion', async () => {
  const s = setup();
  await s.ready();
  await s.session.selectTrack(s.tracks[1]);
  await s.ready();
  s.status(100, { playing: false, didJustFinish: true });
  s.player.playing = false;
  await tick();
  s.session.togglePlay();
  await tick();
  assert.equal(s.player.currentTime, 0);
  assert.equal(s.player.playing, true);
  assert.equal(s.writes.at(-1).positionSeconds, 0);
});

test('reopening a playing book preserves its position and does not reload or save it again', async () => {
  const s = setup({ positionSeconds: 60 });
  await s.ready();
  s.status(52);
  const writes = s.writes.length;
  await s.session.resumeOnOpen();
  assert.equal(s.player.currentTime, 52);
  assert.equal(s.player.playing, true);
  assert.equal(s.writes.length, writes);
  assert.equal(s.replacements.length, 1);
});

test('reopening a paused book rewinds 15 seconds once and starts playback', async () => {
  for (const [position, expected] of [
    [10, 0],
    [60, 45],
  ]) {
    const s = setup();
    await s.ready();
    s.status(position);
    s.session.togglePlay();
    assert.equal(s.player.playing, false);
    await s.session.resumeOnOpen();
    assert.equal(s.player.currentTime, expected);
    assert.equal(s.player.playing, true);
    assert.equal(s.writes.at(-1).positionSeconds, expected);
    await s.session.resumeOnOpen();
    assert.equal(s.player.currentTime, expected);
    assert.equal(s.replacements.length, 1);
  }
});

test('ordinary Play after Pause resumes without rewinding', async () => {
  const s = setup();
  await s.ready();
  s.status(60);
  s.session.togglePlay();
  s.session.togglePlay();
  assert.equal(s.player.currentTime, 60);
  assert.equal(s.player.playing, true);
});

test('clicking any track starts it at zero, ignoring its saved checkpoint', async () => {
  const s = setup({ getProgress: () => ({ positionSeconds: 75 }) });
  await s.ready();
  s.session.togglePlay();
  await s.session.selectTrack(s.tracks[1]);
  await s.ready();
  assert.equal(s.player.currentTime, 0);
  assert.equal(s.player.playing, true);
  assert.equal(s.writes.at(-1).trackId, 'track-1');
  assert.equal(s.writes.at(-1).positionSeconds, 0);
  s.status(30);
  await s.session.selectTrack(s.tracks[1]);
  await s.ready();
  assert.equal(s.player.currentTime, 0);
  assert.equal(s.player.playing, true);
  assert.equal(s.writes.at(-1).positionSeconds, 0);
});

test('automatic next track starts at zero even if it has saved progress', async () => {
  const s = setup({
    getProgress: (id) => (id === 'track-1' ? { positionSeconds: 75 } : undefined),
  });
  await s.ready();
  s.status(100, { playing: false, didJustFinish: true });
  await tick();
  await s.ready();
  assert.equal(s.player.currentTime, 0);
  assert.equal(s.player.playing, true);
  assert.equal(s.writes.at(-1).trackId, 'track-1');
});
