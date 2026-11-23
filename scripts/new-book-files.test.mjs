import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
const files = new Map();
const reads = new Map();
let skippedCopies = [];
const savedBook = {
  id: 'book-a',
  title: 'Book',
  author: 'Author',
  tracks: [{ filePath: 'old.mp3' }],
};
globalThis.__verifiedImport = {
  listBooks: async () => [savedBook],
  getBook: async () => savedBook,
  updateBookAuthor: async () => {},
  saveBook: async () => {},
  saveBookFiles: async () => ({ bookId: 'book-a', skippedFiles: skippedCopies, files: [] }),
};
globalThis.__duplicateFiles = {
  Paths: { document: '/documents' },
  File: class {
    constructor(base, path) {
      this.uri = path === undefined ? base : `${base}/${path}`;
    }
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      return files.get(this.uri)?.length ?? 0;
    }
    async digest(algorithm) {
      assert.equal(algorithm, 'SHA-256');
      reads.set(this.uri, (reads.get(this.uri) ?? 0) + 1);
      const value = files.get(this.uri);
      if (value === undefined) throw new Error('Unreadable source');
      return createHash('sha256').update(value).digest('hex');
    }
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const imports = {
      './book-repository': 'listBooks,getBook,updateBookAuthor,saveBook',
      './library-storage': 'saveBookFiles',
    };
    if (imports[specifier])
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(`export const {${imports[specifier]}}=globalThis.__verifiedImport;`)}`,
      };
    if (specifier === 'expo-file-system')
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent('export const {File,Paths}=globalThis.__duplicateFiles; export class Directory {}')}`,
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
const { findNewBookFiles } = await import('../src/services/new-book-files.ts');
function prepare() {
  files.clear();
  reads.clear();
}
const selected = (uri) => ({ uri, name: uri.split('/').at(-1) });

test('renamed duplicates are skipped and same-sized distinct parts are retained', async () => {
  prepare();
  files.set('/documents/old.mp3', 'audio-a');
  files.set('/cache/renamed.mp3', 'audio-a');
  files.set('/cache/new.mp3', 'audio-b');
  const result = await findNewBookFiles(
    [selected('/cache/renamed.mp3'), selected('/cache/new.mp3')],
    [{ filePath: 'old.mp3' }],
  );
  assert.deepEqual(
    result.files.map((file) => file.name),
    ['new.mp3'],
  );
  assert.equal(result.matchesSavedTrack, true);
  assert.equal(result.skippedFiles, 0);
  assert.equal(reads.get('/documents/old.mp3'), 1);
});

test('duplicate parts within one selection hash each candidate at most once', async () => {
  prepare();
  for (const uri of ['/cache/a.mp3', '/cache/b.mp3', '/cache/c.mp3']) files.set(uri, 'same-audio');
  const result = await findNewBookFiles([...files.keys()].map(selected), []);
  assert.equal(result.files.length, 1);
  assert.equal(result.matchesSavedTrack, false);
  assert.equal(reads.get('/cache/a.mp3'), 1);
  assert.equal(
    [...reads.values()].every((count) => count === 1),
    true,
  );
});

test('different-sized files need no digest and unreadable comparisons are reported', async () => {
  prepare();
  files.set('/documents/old.mp3', 'long audio');
  files.set('/cache/new.mp3', 'short');
  let result = await findNewBookFiles([selected('/cache/new.mp3')], [{ filePath: 'old.mp3' }]);
  assert.equal(result.files.length, 1);
  assert.equal(reads.size, 0);
  files.set('/documents/empty.mp3', '');
  result = await findNewBookFiles([selected('/cache/missing.mp3')], [{ filePath: 'empty.mp3' }]);
  assert.equal(result.skippedFiles, 1);
  assert.equal(result.matchesSavedTrack, false);
});

const { importBook } = await import('../src/services/book-importer.ts');
const { APP_ERROR_CODES: codes } = await import('../src/constants/errors.ts');
test('only a fully verified book can become a completed archive dependency', async () => {
  prepare();
  files.set('/documents/old.mp3', 'same-audio');
  files.set('/cache/duplicate.mp3', 'same-audio');
  files.set('/cache/new.mp3', 'other-data');
  const verified = [];
  const issues = [];
  const run = (uri) =>
    importBook(
      'account-a',
      { title: 'Book', author: 'Author', files: [selected(uri)] },
      undefined,
      (id) => verified.push(id),
      undefined,
      (code) => issues.push(code),
    );
  assert.equal(await run('/cache/duplicate.mp3'), null);
  assert.deepEqual(verified, ['book-a']);
  verified.length = 0;
  skippedCopies = [selected('/cache/new.mp3')];
  await run('/cache/new.mp3');
  assert.deepEqual(verified, []);
  assert.deepEqual(issues, [codes.importFileSaveFailed]);
  skippedCopies = [];
  await run('/cache/new.mp3');
  assert.deepEqual(verified, ['book-a']);
});

test('comparison progress advances for retained files and duplicates', async () => {
  prepare();
  files.set('/documents/old.mp3', 'same');
  files.set('/cache/a.mp3', 'same');
  files.set('/cache/b.mp3', 'different');
  const progress = [];
  await findNewBookFiles(
    [selected('/cache/a.mp3'), selected('/cache/b.mp3')],
    [{ filePath: 'old.mp3' }],
    (fraction) => progress.push(fraction),
  );
  assert.deepEqual(progress, [0.5, 1]);
});
