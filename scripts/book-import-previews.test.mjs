import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
let root;
let records;
let events;
let lookup;
let account = 'a';
const listeners = new Set();
const mutations = [];
class Directory {
  constructor(...parts) {
    this.uri = join(...parts.map((part) => part.uri ?? part));
  }
  create() {
    mkdirSync(this.uri, { recursive: true });
  }
  get exists() {
    return existsSync(this.uri);
  }
  delete() {
    rmSync(this.uri, { recursive: true });
  }
}
class File {
  constructor(...parts) {
    this.uri = join(...parts.map((part) => part.uri ?? part));
  }
  async write(data) {
    events.push('cover-write');
    writeFileSync(this.uri, data);
  }
}
globalThis.__importPreviewMocks = {
  Directory,
  File,
  getImportWorkspaceRoot: () => new Directory(root),
  async readBookFilesMetadata(files) {
    events.push(`metadata:${files[0].uri}`);
    return records.has(files[0].uri) ? [records.get(files[0].uri)] : [];
  },
  async findOpenLibraryCover(title, author, signal) {
    events.push(`lookup:${title}`);
    return lookup?.(title, author, signal) ?? null;
  },
  useAuthStore: {
    getState: () => ({ user: { uid: account } }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  },
};
const modules = {
  'expo-file-system': 'Directory,File',
  './zip-import': 'getImportWorkspaceRoot',
  './book-metadata': 'readBookFilesMetadata',
  './open-library-cover': 'findOpenLibraryCover',
  './auth-store': 'useAuthStore',
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (modules[specifier])
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(`export const {${modules[specifier]}}=globalThis.__importPreviewMocks;`)}`,
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
const { createBookImportPreviews } = await import('../src/services/book-import-previews.ts');
const { useBookImportStore } = await import('../src/stores/book-import-store.ts');
function prepare(t) {
  root = mkdtempSync(join(tmpdir(), 'ab-preview-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  records = new Map();
  events = [];
  lookup = undefined;
  mutations.length = 0;
  account = 'a';
  useBookImportStore.setState({ activeImport: null });
  const controller = new AbortController();
  const assertActive = () => {
    if (controller.signal.aborted) throw new Error('cancelled');
  };
  const previews = createBookImportPreviews(
    (update) => mutations.push(update),
    assertActive,
    controller.signal,
  );
  const add = (uri, album, cover = null) => {
    const file = { uri, name: uri, album, artist: 'Author', cover };
    records.set(uri, file);
    return file;
  };
  return { controller, previews, add };
}

test('embedded cover is published before subsequent metadata and reused without rereading the first MP3', async (t) => {
  const { previews, add } = prepare(t);
  const cover = { data: new Uint8Array([1, 2, 3]), format: 'image/jpeg' };
  const first = add('/a.mp3', 'Book', cover);
  const second = add('/b.mp3', 'Book');
  await previews.prepare(first);
  const published = mutations.at(-1).previews[0];
  assert.equal(published.title, 'Book');
  assert.deepEqual([...readFileSync(published.coverUri)], [1, 2, 3]);
  await previews.read(first);
  await previews.prepare(second);
  assert.deepEqual(events, ['metadata:/a.mp3', 'cover-write', 'metadata:/b.mp3']);
  previews.cleanup();
  assert.equal(existsSync(published.coverUri), false);
});

test('remote cover is attempted before processing the next part and embedded artwork takes precedence later', async (t) => {
  const { previews, add } = prepare(t);
  lookup = () => new Uint8Array([4, 5, 6]);
  const first = add('/a.mp3', 'Book');
  const second = add('/b.mp3', 'Book', { data: new Uint8Array([9]), format: 'image/png' });
  await previews.prepare(first);
  await previews.prepare(second);
  assert.deepEqual(events, [
    'metadata:/a.mp3',
    'lookup:Book',
    'cover-write',
    'metadata:/b.mp3',
    'cover-write',
  ]);
  assert.deepEqual([...readFileSync(mutations.at(-1).previews[0].coverUri)], [9]);
  previews.cleanup();
});

test('several books create separate previews and failed cover searches do not block audio import', async (t) => {
  const { previews, add } = prepare(t);
  lookup = () => {
    throw new Error('TLS failure fixture');
  };
  await previews.prepare(add('/a.mp3', 'Book A'));
  await previews.prepare(add('/b.mp3', 'Book B'));
  assert.deepEqual(
    mutations.findLast((update) => update.previews).previews.map((item) => item.title),
    ['Book A', 'Book B'],
  );
  assert.equal(
    mutations
      .findLast((update) => update.previews)
      .previews.every((item) => item.coverUri === null),
    true,
  );
  previews.cleanup();
});

test('cancellation during cover fetch prevents publishing artwork or writing files', async (t) => {
  const { controller, previews, add } = prepare(t);
  lookup = () => {
    controller.abort();
    return new Uint8Array([1]);
  };
  await assert.rejects(previews.prepare(add('/a.mp3', 'Book')));
  assert.equal(events.includes('cover-write'), false);
  previews.cleanup();
});

test('import UI store guards job identity, clamps monotonic progress and clears when the account changes', (t) => {
  prepare(t);
  const store = useBookImportStore.getState();
  store.startImport('first', 'a', 'archive.zip');
  store.updateImport('first', { progress: 40, stage: 'extracting' });
  store.updateImport('old-job', { progress: 90 });
  store.updateImport('first', { progress: 10 });
  assert.equal(useBookImportStore.getState().activeImport.progress, 40);
  store.updateImport('first', { progress: NaN });
  assert.equal(useBookImportStore.getState().activeImport.progress, 40);
  store.updateImport('first', { progress: 999 });
  assert.equal(useBookImportStore.getState().activeImport.progress, 100);
  store.startImport('second', 'a', 'next.zip');
  store.clearImport('first');
  assert.equal(useBookImportStore.getState().activeImport.id, 'second');
  account = 'b';
  for (const listener of listeners) listener({ user: { uid: 'b' } }, { user: { uid: 'a' } });
  assert.equal(useBookImportStore.getState().activeImport, null);
  store.startImport('stale', 'a', 'stale.zip');
  assert.equal(useBookImportStore.getState().activeImport, null);
});

test('repeated embedded pictures keep one preview file and one selected cover per book', async (t) => {
  const { previews, add } = prepare(t);
  const first = add('/a.mp3', 'Book', { data: new Uint8Array([1, 2, 3]), format: 'image/jpeg' });
  const second = add('/b.mp3', 'Book', { data: new Uint8Array([1, 2, 3]), format: 'image/jpeg' });
  const third = add('/c.mp3', 'Book', { data: new Uint8Array([4, 5, 6]), format: 'image/jpeg' });
  await previews.prepare(first);
  const uri = mutations.findLast((update) => update.previews).previews[0].coverUri;
  await previews.prepare(second);
  await previews.prepare(third);
  const cover = await previews.prepareCover({
    title: 'Book',
    author: 'Author',
    files: [first, second, third],
  });
  assert.equal(cover, first.cover);
  assert.equal(mutations.findLast((update) => update.previews).previews[0].coverUri, uri);
  assert.equal(events.filter((event) => event === 'cover-write').length, 1);
  assert.deepEqual([...readFileSync(uri)], [1, 2, 3]);
  previews.cleanup();
});

const { buildLibraryRows } = await import('../src/utils/library-rows.ts');
const { bookGroupKey } = await import('../src/utils/group-files.ts');
const savedBook = {
  id: 'saved-id',
  userId: 'a',
  title: 'Book',
  author: 'Author',
  coverPath: 'library/cover.jpg',
  duration: 100,
  createdAt: 1,
};
const activePreview = {
  userId: 'a',
  progress: 75,
  previews: [
    {
      key: bookGroupKey('Book', 'Author'),
      title: 'Book',
      author: 'Author',
      coverUri: '/cache/preview.jpg',
    },
  ],
};

test('preview, committed overlay and ready library row keep the same image/list identity', () => {
  const pending = buildLibraryRows([], activePreview)[0];
  const committed = buildLibraryRows([savedBook], activePreview)[0];
  const ready = buildLibraryRows([savedBook], null)[0];
  assert.equal(pending.id, committed.id);
  assert.equal(committed.id, ready.id);
  assert.equal(committed.coverUri, pending.coverUri);
  assert.equal(committed.savedId, savedBook.id);
  assert.equal(ready.book.coverPath, savedBook.coverPath);
  assert.equal(ready.progress, undefined);
});

test('row identities are account scoped and legacy duplicate books keep distinct keys', () => {
  const first = buildLibraryRows([savedBook], null)[0];
  const other = buildLibraryRows([{ ...savedBook, userId: 'b' }], null)[0];
  assert.notEqual(first.id, other.id);
  const duplicates = buildLibraryRows(
    [savedBook, { ...savedBook, id: 'legacy-id' }],
    activePreview,
  );
  assert.equal(duplicates.length, 2);
  assert.equal(new Set(duplicates.map((row) => row.id)).size, 2);
});
