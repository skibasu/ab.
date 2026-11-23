import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
const listeners = new Set();
let account = 'account-a';
let cleanupCount;
let pickerCleanupCount;
let metadataReads;
let stages;
let commits;
let prepareHook;
let metadataHook;
let commitHook;
let directSize;
let historyHit;
let historyRecords;
let verifyCommits;
let digestHook;
function changeAccount(uid) {
  account = uid;
  for (const listener of listeners) listener({ user: { uid } });
}

const mocks = {
  File: class {
    exists = true;
    async digest() {
      await digestHook?.();
      return 'archive-sha256';
    }
    get size() {
      return directSize;
    }
  },
  useAuthStore: {
    getState: () => ({ user: { uid: account } }),
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  },
  async prepareZipImport(asset, signal) {
    assert.equal(asset.name, 'archive.zip');
    await prepareHook?.(signal);
    return {
      files: [
        { uri: '/workspace/a.mp3', name: 'a.mp3' },
        { uri: '/workspace/b.mp3', name: 'b.mp3' },
      ],
      cleanup() {
        cleanupCount++;
      },
    };
  },
  async hasCompletedZip() {
    return historyHit;
  },
  async rememberCompletedZip(...args) {
    historyRecords.push(args);
  },
  assertImportDiskSpace() {},
  cleanupPickerFiles() {
    pickerCleanupCount++;
  },
  async readBookFilesMetadata(files) {
    metadataReads++;
    const result = await metadataHook?.(files);
    return result ?? files.map((file) => ({ ...file, album: file.name, artist: 'Author' }));
  },
  async importBook(userId, book, assertActive, onVerified) {
    assertActive();
    await commitHook?.(book, assertActive);
    assertActive();
    commits.push({ userId, title: book.title });
    if (verifyCommits) onVerified?.(`book-${book.title}`);
    return {};
  },
};
globalThis.__importSessionMocks = mocks;
const modules = {
  'expo-file-system': ['File'],
  '@/stores/auth-store': ['useAuthStore'],
  './zip-import': ['prepareZipImport', 'assertImportDiskSpace', 'cleanupPickerFiles'],
  './book-metadata': ['readBookFilesMetadata'],
  './book-importer': ['importBook'],
  './zip-import-history': ['hasCompletedZip', 'rememberCompletedZip'],
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (modules[specifier])
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(`export const {${modules[specifier].join(',')}}=globalThis.__importSessionMocks;`)}`,
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
const { importSelectedBooks } = await import('../src/services/import-selected-books.ts');
const { APP_ERROR_CODES: codes } = await import('../src/constants/errors.ts');
const { BOOK_IMPORT_CONFIG } = await import('../src/constants/book-import-config.ts');
const archive = [{ uri: '/cache/archive.zip', name: 'archive.zip' }];

function prepare(t) {
  account = 'account-a';
  cleanupCount = pickerCleanupCount = metadataReads = 0;
  stages = [];
  commits = [];
  prepareHook = metadataHook = commitHook = undefined;
  directSize = 1;
  historyHit = false;
  historyRecords = [];
  verifyCommits = true;
  digestHook = undefined;
  t.after(() => assert.equal(listeners.size, 0));
}
const run = (signal) =>
  importSelectedBooks('account-a', archive, 'application/zip', {
    signal,
    onStageChange: (stage) => stages.push(stage),
  });

test('one archive can commit multiple books to the captured account, sequentially', async (t) => {
  prepare(t);
  let active = 0;
  commitHook = async () => {
    assert.equal(++active, 1);
    await Promise.resolve();
    active--;
  };
  assert.deepEqual(await run(), { savedBooks: 2, failedBooks: 0 });
  assert.deepEqual(commits, [
    { userId: 'account-a', title: 'a.mp3' },
    { userId: 'account-a', title: 'b.mp3' },
  ]);
  assert.deepEqual(stages, ['preparing', 'saving']);
  assert.equal(cleanupCount, 1);
  assert.equal(pickerCleanupCount, 1);
});

test('a failed archive never reaches metadata or database writes', async (t) => {
  prepare(t);
  prepareHook = async () => {
    throw new Error('Simulated corrupt archive');
  };
  await assert.rejects(run());
  assert.equal(metadataReads, 0);
  assert.deepEqual(commits, []);
  assert.equal(pickerCleanupCount, 1);
});

test('a different account cannot start an import for the previous account', async (t) => {
  prepare(t);
  changeAccount('account-b');
  await assert.rejects(run(), { code: codes.importCancelled });
  assert.equal(metadataReads, 0);
  assert.deepEqual(commits, []);
});

test('changing account during extraction aborts before metadata and cleans the workspace', async (t) => {
  prepare(t);
  prepareHook = async () => changeAccount('account-b');
  await assert.rejects(run(), { code: codes.importCancelled });
  assert.equal(metadataReads, 0);
  assert.deepEqual(commits, []);
  assert.equal(cleanupCount, 1);
});

test('changing account during metadata aborts before any book is committed', async (t) => {
  prepare(t);
  metadataHook = async () => changeAccount('account-b');
  await assert.rejects(run(), { code: codes.importCancelled });
  assert.deepEqual(commits, []);
  assert.equal(cleanupCount, 1);
  assert.deepEqual(stages, ['preparing']);
});

test('the commit guard detects an account change during an asynchronous save', async (t) => {
  prepare(t);
  commitHook = async (book, assertActive) => {
    assert.equal(book.title, 'a.mp3');
    changeAccount('account-b');
    assertActive();
  };
  await assert.rejects(run(), { code: codes.importCancelled });
  assert.deepEqual(commits, []);
  assert.equal(cleanupCount, 1);
});

test('cancellation during preparation stops before any database writes', async (t) => {
  prepare(t);
  const controller = new AbortController();
  metadataHook = async () => controller.abort();
  await assert.rejects(run(controller.signal), { code: codes.importCancelled });
  assert.deepEqual(commits, []);
  assert.equal(cleanupCount, 1);
  assert.equal(pickerCleanupCount, 1);
});

test('a book save error is reported while the next book can still be saved', async (t) => {
  prepare(t);
  const log = t.mock.method(console, 'error', () => {});
  commitHook = async (book) => {
    if (book.title === 'a.mp3') throw new Error('Simulated write failure');
  };
  assert.deepEqual(await run(), { savedBooks: 1, failedBooks: 1 });
  assert.equal(log.mock.callCount(), 1);
  assert.equal(commits[0].title, 'b.mp3');
  assert.equal(cleanupCount, 1);
});

test('ZIP and direct MP3 selection limits are enforced before reading metadata', async (t) => {
  prepare(t);
  await assert.rejects(
    importSelectedBooks('account-a', [...archive, ...archive], 'application/zip'),
    { code: codes.importLimitExceeded },
  );
  const manyFiles = Array.from({ length: BOOK_IMPORT_CONFIG.maxMp3Files + 1 }, () => archive[0]);
  await assert.rejects(importSelectedBooks('account-a', manyFiles, 'audio/mpeg'), {
    code: codes.importLimitExceeded,
  });
  directSize = BOOK_IMPORT_CONFIG.maxDirectMp3Bytes + 1;
  await assert.rejects(importSelectedBooks('account-a', archive, 'audio/mpeg'), {
    code: codes.importLimitExceeded,
  });
  assert.equal(metadataReads, 0);
  assert.deepEqual(commits, []);
});

test('known ZIP skips extraction, metadata and commits but cleans picker files', async (t) => {
  prepare(t);
  historyHit = true;
  prepareHook = () => assert.fail('Known ZIP must not be extracted');
  assert.deepEqual(await run(), { savedBooks: 0, failedBooks: 0 });
  assert.equal(metadataReads, 0);
  assert.deepEqual(commits, []);
  assert.equal(cleanupCount, 0);
  assert.equal(pickerCleanupCount, 1);
});

test('complete ZIP records verified book dependencies for the captured account', async (t) => {
  prepare(t);
  await run();
  assert.equal(historyRecords.length, 1);
  assert.deepEqual(historyRecords[0].slice(0, 4), [
    'account-a',
    'archive-sha256',
    1,
    ['book-a.mp3', 'book-b.mp3'],
  ]);
});

test('partial metadata or audio persistence never records a completed ZIP', async (t) => {
  prepare(t);
  verifyCommits = false;
  await run();
  assert.deepEqual(historyRecords, []);
  verifyCommits = true;
  metadataHook = (files) => [{ ...files[0], album: 'Book', artist: 'Author' }];
  await run();
  assert.deepEqual(historyRecords, []);
});

test('account change during archive fingerprinting prevents extraction and receipt writes', async (t) => {
  prepare(t);
  digestHook = () => changeAccount('account-b');
  prepareHook = () => assert.fail('Cancelled fingerprint must not extract');
  await assert.rejects(run(), { code: codes.importCancelled });
  assert.equal(metadataReads, 0);
  assert.deepEqual(historyRecords, []);
  assert.equal(pickerCleanupCount, 1);
});
