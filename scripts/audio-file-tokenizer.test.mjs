import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { parseBuffer, parseFromTokenizer, selectCover } from 'music-metadata';
import { EndOfStreamError } from 'strtok3/core';

// Resolve the app's TypeScript alias when running its tokenizer directly in Node.js.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/constants/errors') {
      return nextResolve(new URL('../src/constants/errors.ts', import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { AudioFileTokenizer } = await import('../src/services/audio-file-tokenizer.ts');
const TEST_ERROR_MESSAGES = { fileReadFailed: 'Simulated file read failure' };

function createReader(bytes, fragmentSize = Infinity) {
  const stats = { bytesRead: 0, maxRead: 0, closes: 0 };
  return {
    stats,
    size: bytes.length,
    async read(position, length) {
      stats.maxRead = Math.max(stats.maxRead, length);
      const chunk = bytes.subarray(position, position + Math.min(length, fragmentSize));
      stats.bytesRead += chunk.length;
      return chunk;
    },
    close() {
      stats.closes += 1;
    },
  };
}

async function parseReader(reader) {
  const tokenizer = new AudioFileTokenizer(reader);
  try {
    return await parseFromTokenizer(tokenizer, { skipCovers: false });
  } finally {
    await tokenizer.close();
  }
}

for (const name of ['pink-panther.mp3', 'mag.mp3']) {
  test(`matches buffer metadata and skips audio payload: ${name}`, async () => {
    const bytes = await readFile(new URL(`../assets/audio/${name}`, import.meta.url));
    const expected = await parseBuffer(bytes, { mimeType: 'audio/mpeg', size: bytes.length });
    const reader = createReader(bytes);
    const actual = await parseReader(reader);

    assert.deepEqual(actual.common, expected.common);
    assert.deepEqual(actual.format, expected.format);
    assert.deepEqual(actual.native, expected.native);
    assert.ok(reader.stats.bytesRead < bytes.length / 2);
    assert.ok(reader.stats.maxRead <= 64 * 1024);
    assert.equal(reader.stats.closes, 1);
  });
}

test('preserves peek position, supports seeking backwards and handles short reads and EOF', async () => {
  const reader = createReader(Uint8Array.from([1, 2, 3, 4, 5]), 2);
  const tokenizer = new AudioFileTokenizer(reader);
  const target = new Uint8Array(4);

  await tokenizer.peekBuffer(target);
  assert.deepEqual([...target], [1, 2, 3, 4]);
  assert.equal(tokenizer.position, 0);

  assert.equal(await tokenizer.readBuffer(target), 4);
  assert.equal(tokenizer.position, 4);
  await assert.rejects(tokenizer.peekBuffer(target), EndOfStreamError);
  assert.equal(tokenizer.position, 4);
  assert.equal(await tokenizer.readBuffer(target, { mayBeLess: true }), 1);
  assert.equal(target[0], 5);

  tokenizer.setPosition(1);
  assert.equal(await tokenizer.readBuffer(target, { length: 2 }), 2);
  assert.deepEqual([...target.subarray(0, 2)], [2, 3]);
  tokenizer.setPosition(100);
  assert.equal(await tokenizer.peekBuffer(target, { mayBeLess: true }), 0);
  await assert.rejects(tokenizer.readBuffer(target, { length: -1 }), RangeError);

  await tokenizer.close();
  await tokenizer.close();
  assert.equal(reader.stats.closes, 1);
  await assert.rejects(tokenizer.readBuffer(target), /closed/);
});

test('reads embedded cover art and trailing ID3v1 tags', async () => {
  const source = await readFile(new URL('../assets/audio/pink-panther.mp3', import.meta.url));
  const tagSize = source.subarray(6, 10).reduce((size, byte) => (size << 7) | byte, 0);
  const audio = source.subarray(10 + tagSize);
  const image = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const picture = Buffer.concat([Buffer.from('\0image/jpeg\0\x03\0'), image]);
  const frame = Buffer.alloc(10);
  frame.write('APIC');
  frame.writeUInt32BE(picture.length, 4);
  const body = Buffer.concat([frame, picture]);
  const header = Buffer.from([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, body.length]);
  const trailer = Buffer.alloc(128);
  trailer.write('TAG');
  trailer.write('Sample chapter', 3);
  trailer.write('Sample author', 33);
  trailer.write('Sample book', 63);

  const reader = createReader(Buffer.concat([header, body, audio, trailer]), 7);
  const metadata = await parseReader(reader);

  assert.equal(metadata.common.title, 'Sample chapter');
  assert.equal(metadata.common.artist, 'Sample author');
  assert.equal(metadata.common.album, 'Sample book');
  const cover = selectCover(metadata.common.picture);
  assert.equal(cover?.format, 'image/jpeg');
  assert.deepEqual([...cover.data], [...image]);
  assert.equal(reader.stats.closes, 1);
});

test('closes the reader when parsing fails', async () => {
  const reader = createReader(new Uint8Array(100));
  reader.read = async () => {
    throw new Error(TEST_ERROR_MESSAGES.fileReadFailed);
  };

  await assert.rejects(parseReader(reader), { message: TEST_ERROR_MESSAGES.fileReadFailed });
  assert.equal(reader.stats.closes, 1);
});
