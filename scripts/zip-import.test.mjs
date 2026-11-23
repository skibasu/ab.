import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  closeSync,
  readSync,
  writeSync,
  statSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  renameSync,
  unlinkSync,
  rmSync,
  readdirSync,
} from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from '@zip.js/zip.js/index-native.js';

const sourceRoot = new URL('../src/', import.meta.url);
let freeSpace = 100_000_000_000;
let failWrite = false;
let openHandles = 0;
const pathOf = (parts) => join(...parts.map((part) => part.uri ?? part));
class TestDirectory {
  constructor(...parts) {
    this.uri = pathOf(parts);
  }
  get exists() {
    return existsSync(this.uri);
  }
  create() {
    mkdirSync(this.uri, { recursive: true });
  }
  delete() {
    rmSync(this.uri, { recursive: true });
  }
}
class TestFile {
  constructor(...parts) {
    this.uri = pathOf(parts);
  }
  get exists() {
    return existsSync(this.uri);
  }
  get size() {
    return statSync(this.uri).size;
  }
  create() {
    writeFileSync(this.uri, new Uint8Array());
  }
  delete() {
    unlinkSync(this.uri);
  }
  copy(to) {
    copyFileSync(this.uri, to.uri);
  }
  move(to) {
    renameSync(this.uri, to.uri);
    this.uri = to.uri;
  }
  open(mode) {
    const fd = openSync(this.uri, mode ?? 'r');
    const size = statSync(this.uri).size;
    let closed = false;
    openHandles++;
    return {
      size,
      offset: 0,
      async readBytes(length) {
        const bytes = new Uint8Array(length);
        const count = readSync(fd, bytes, 0, length, this.offset);
        this.offset += count;
        return bytes.subarray(0, count);
      },
      async writeBytes(bytes) {
        if (failWrite) throw new Error('Simulated full disk');
        this.offset += writeSync(fd, bytes, 0, bytes.length, this.offset);
      },
      close() {
        if (!closed) {
          closed = true;
          closeSync(fd);
          openHandles--;
        }
      },
    };
  }
}
const Paths = {
  cache: '',
  get availableDiskSpace() {
    return freeSpace;
  },
};
globalThis.__zipFs = {
  File: TestFile,
  Directory: TestDirectory,
  Paths,
  FileMode: { ReadOnly: 'r', WriteOnly: 'w' },
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-file-system')
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent('export const {File,Directory,Paths,FileMode}=globalThis.__zipFs;')}`,
      };
    if (specifier === 'expo-crypto') return nextResolve('node:crypto', context);
    if (specifier.startsWith('@/'))
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot.href)) {
      const target = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(target)) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { extractZip } = await import('../src/services/zip-reader.ts');
const { prepareZipImport, cleanupImportWorkspaces } = await import('../src/services/zip-import.ts');
const { BOOK_IMPORT_CONFIG } = await import('../src/constants/book-import-config.ts');
const { APP_ERROR_CODES: codes } = await import('../src/constants/errors.ts');

async function makeZip(items) {
  const writer = new ZipWriter(new Uint8ArrayWriter(), {
    useWebWorkers: false,
    useCompressionStream: false,
  });
  for (const [name, value, options] of items) {
    await writer.add(
      name,
      new Uint8ArrayReader(typeof value === 'string' ? new TextEncoder().encode(value) : value),
      options,
    );
  }
  return await writer.close();
}

function readZip(bytes, overrides = {}) {
  const outputs = new Map();
  let maxWrite = 0;
  const source = {
    size: bytes.length,
    async read(offset, length) {
      return bytes.slice(offset, offset + length);
    },
    close() {},
  };
  const result = extractZip(source, {
    ...overrides,
    openOutput(name) {
      const parts = [];
      outputs.set(name, parts);
      return {
        async write(chunk) {
          maxWrite = Math.max(maxWrite, chunk.length);
          parts.push(chunk);
        },
        close() {},
      };
    },
  });
  return {
    outputs,
    result,
    get maxWrite() {
      return maxWrite;
    },
  };
}

function prepare(t) {
  const root = mkdtempSync(join(tmpdir(), 'ab-zip-test-'));
  Paths.cache = join(root, 'cache');
  mkdirSync(Paths.cache);
  freeSpace = 100_000_000_000;
  failWrite = false;
  t.after(() => {
    assert.equal(openHandles, 0);
    rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('nested MP3s are extracted while text, nested ZIPs and Finder files are discarded', async () => {
  const bytes = await makeZip([
    ['Book/part1.MP3', 'first'],
    ['Book/sub/part2.mp3', 'second'],
    ['notes.txt', 'notes'],
    ['nested.zip', 'not expanded'],
    ['__MACOSX/._part.mp3', 'metadata'],
  ]);
  const run = readZip(bytes);
  const manifest = await run.result;
  assert.deepEqual([...run.outputs.keys()], ['Book/part1.MP3', 'Book/sub/part2.mp3']);
  assert.equal(manifest.entries, 5);
  assert.equal(manifest.mp3Files, 2);
  assert.equal(manifest.totalBytes, 5 + 6 + 5 + 12 + 8);
});

test('deflated and stored MP3s both retain their exact bytes', async () => {
  const bytes = new Uint8Array(2_000_000).fill(7);
  const archive = await makeZip([
    ['compressed.mp3', bytes],
    ['stored.mp3', bytes, { level: 0 }],
  ]);
  const run = readZip(archive);
  await run.result;
  for (const parts of run.outputs.values()) {
    assert.deepEqual(Buffer.concat(parts), Buffer.from(bytes));
  }
  assert.ok(run.maxWrite <= BOOK_IMPORT_CONFIG.chunkBytes);
});

test('all entry and output limits are checked before any destination opens', async () => {
  const bytes = await makeZip([
    ['one.mp3', 'one'],
    ['two.mp3', 'two'],
    ['notes.txt', 'text'],
  ]);
  for (const override of [
    { maxArchiveEntries: 2 },
    { maxMp3Files: 1 },
    { maxUncompressedBytes: 5 },
    { maxZipBytes: bytes.length - 1 },
  ]) {
    const run = readZip(bytes, { limits: { ...BOOK_IMPORT_CONFIG, ...override } });
    await assert.rejects(run.result, { code: codes.importLimitExceeded });
    assert.equal(run.outputs.size, 0);
  }
});

test('an oversized central-directory allocation is refused', async () => {
  const run = readZip(await makeZip([['part.mp3', 'audio']]), {
    limits: { ...BOOK_IMPORT_CONFIG, maxMetadataReadBytes: 1 },
  });
  await assert.rejects(run.result, { code: codes.importLimitExceeded });
});

test('empty archives and archives without MP3s have a controlled result', async () => {
  for (const bytes of [await makeZip([]), await makeZip([['cover.jpg', 'image']])]) {
    await assert.rejects(readZip(bytes).result, { code: codes.importNoAudio });
  }
});

test('ZIP64 entries remain supported within the product limits', async () => {
  const archive = await makeZip([['part.mp3', 'audio', { zip64: true }]]);
  const run = readZip(archive);
  assert.equal((await run.result).mp3Files, 1);
});

test('truncated and malformed archives are rejected', async () => {
  const bytes = await makeZip([['part.mp3', 'audio']]);
  for (const invalid of [bytes.slice(0, -12), new Uint8Array([1, 2, 3]), new Uint8Array()]) {
    await assert.rejects(readZip(invalid).result, { code: codes.importInvalidZip });
  }
});

test('CRC corruption in either an MP3 or a discarded file rejects the whole preparation', async () => {
  for (const name of ['part.mp3', 'notes.txt']) {
    const bytes = Buffer.from(
      await makeZip([
        [name, 'unique audio bytes', { level: 0 }],
        ['other.mp3', 'other'],
      ]),
    );
    bytes[bytes.indexOf('unique audio bytes')] ^= 1;
    await assert.rejects(readZip(bytes).result, { code: codes.importInvalidZip });
  }
});

test('unsafe paths never become destination paths', async () => {
  const bytes = Buffer.from(await makeZip([['safe/a.mp3', 'audio']]));
  for (
    let offset = bytes.indexOf('safe/a.mp3');
    offset !== -1;
    offset = bytes.indexOf('safe/a.mp3')
  ) {
    bytes.write('../bad.mp3', offset);
  }
  const run = readZip(bytes);
  await assert.rejects(run.result, { code: codes.importInvalidZip });
  assert.equal(run.outputs.size, 0);
});

test('encrypted ZIPs and symlinks are rejected before extraction', async () => {
  const encrypted = await makeZip([
    ['part.mp3', 'audio', { password: 'test-only-password', zipCrypto: true }],
  ]);
  await assert.rejects(readZip(encrypted).result, { code: codes.importEncryptedZip });
  const symlink = await makeZip([['part.mp3', '../outside', { unixMode: 0o120777 }]]);
  await assert.rejects(readZip(symlink).result, { code: codes.importInvalidZip });
});

test('declared uncompressed sizes cannot hide larger output', async () => {
  const bytes = Buffer.from(await makeZip([['part.mp3', new Uint8Array(100_000).fill(1)]]));
  const central = bytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  bytes.writeUInt32LE(1, central + 24);
  await assert.rejects(readZip(bytes).result, { code: codes.importInvalidZip });
});

test('cancellation stops extraction and closes the active output', async () => {
  const controller = new AbortController();
  let closed = false;
  await assert.rejects(
    extractZip(
      {
        size: 1,
        read: async () => new Uint8Array(),
        close() {},
      },
      {
        signal: AbortSignal.abort(),
        openOutput() {
          assert.fail();
        },
      },
    ),
    { code: codes.importCancelled },
  );
  const bytes = await makeZip([['part.mp3', new Uint8Array(200_000).fill(1)]]);
  await assert.rejects(
    extractZip(
      {
        size: bytes.length,
        read: async (offset, length) => bytes.slice(offset, offset + length),
        close() {},
      },
      {
        signal: controller.signal,
        openOutput: () => ({
          async write() {
            controller.abort();
          },
          close() {
            closed = true;
          },
        }),
      },
    ),
    { code: codes.importCancelled },
  );
  assert.ok(closed);
});

test('workspace cleanup preserves original documents and uses generated MP3 paths', async (t) => {
  const root = prepare(t);
  const source = join(root, 'original.zip');
  writeFileSync(source, await makeZip([['Book/part.mp3', 'audio']]));
  const prepared = await prepareZipImport({ uri: source, name: 'original.zip' });
  assert.equal(prepared.files[0].name, 'part.mp3');
  assert.match(prepared.files[0].uri, /[a-f0-9-]+\.mp3$/);
  assert.equal(readFileSync(prepared.files[0].uri, 'utf8'), 'audio');
  prepared.cleanup();
  assert.ok(existsSync(source));
  assert.deepEqual(readdirSync(join(Paths.cache, 'book-import-work')), []);
});

test('the picker cache copy is moved into the managed workspace and removed on completion', async (t) => {
  prepare(t);
  mkdirSync(join(Paths.cache, 'DocumentPicker'));
  const source = join(Paths.cache, 'DocumentPicker', `${randomUUID()}.zip`);
  writeFileSync(source, await makeZip([['part.mp3', 'audio']]));
  const prepared = await prepareZipImport({ uri: source, name: 'archive.zip' });
  assert.equal(existsSync(source), false);
  prepared.cleanup();
  assert.deepEqual(readdirSync(join(Paths.cache, 'book-import-work')), []);
});

test('insufficient space and write failures release handles and remove partial output', async (t) => {
  const root = prepare(t);
  const source = join(root, 'original.zip');
  writeFileSync(source, await makeZip([['part.mp3', new Uint8Array(500_000)]]));
  freeSpace = BOOK_IMPORT_CONFIG.diskReserveBytes + 600_000;
  await assert.rejects(prepareZipImport({ uri: source, name: 'archive.zip' }), {
    code: codes.importNoSpace,
  });
  assert.deepEqual(readdirSync(join(Paths.cache, 'book-import-work')), []);
  freeSpace = 100_000_000_000;
  failWrite = true;
  await assert.rejects(prepareZipImport({ uri: source, name: 'archive.zip' }));
  assert.equal(openHandles, 0);
  assert.ok(existsSync(source));
  assert.deepEqual(readdirSync(join(Paths.cache, 'book-import-work')), []);
});

test('startup recovery removes only the dedicated workspace tree', (t) => {
  const root = prepare(t);
  mkdirSync(join(Paths.cache, 'book-import-work', 'interrupted'), { recursive: true });
  writeFileSync(join(Paths.cache, 'book-import-work', 'interrupted', 'partial.mp3'), 'partial');
  writeFileSync(join(root, 'library.mp3'), 'saved audio');
  cleanupImportWorkspaces();
  assert.ok(existsSync(join(root, 'library.mp3')));
  assert.equal(existsSync(join(Paths.cache, 'book-import-work')), false);
});
