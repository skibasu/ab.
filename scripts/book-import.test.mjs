import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import test from 'node:test';

const contents = new Map();
const directories = new Set();
const failedCopies = new Set();
let failCoverWrite = false;
const TEST_ERROR_MESSAGES = {
  fileRead: 'Simulated file read failure',
  fileCopy: 'Simulated file copy failure',
  coverWrite: 'Simulated cover write failure',
};

const uriFrom = (parts) => parts.map((part) => part.uri ?? part).join('/');

// Exercise the real import services with deterministic native I/O failures.
class TestDirectory {
  constructor(...parts) {
    this.uri = uriFrom(parts);
  }
  get exists() {
    return directories.has(this.uri);
  }
  create() {
    directories.add(this.uri);
  }
  delete() {
    for (const key of contents.keys()) {
      if (key.startsWith(`${this.uri}/`)) contents.delete(key);
    }
    directories.delete(this.uri);
  }
}

class TestFile {
  constructor(...parts) {
    this.uri = uriFrom(parts);
  }
  get exists() {
    return contents.has(this.uri);
  }
  create() {
    contents.set(this.uri, new Uint8Array());
  }
  delete() {
    contents.delete(this.uri);
  }
  async copy(destination) {
    // A failed native copy may leave a partial file that the service must remove.
    contents.set(destination.uri, new Uint8Array([0]));
    if (failedCopies.has(this.uri)) throw new Error(TEST_ERROR_MESSAGES.fileCopy);
    contents.set(destination.uri, contents.get(this.uri));
  }
  async write(bytes) {
    if (failCoverWrite) throw new Error(TEST_ERROR_MESSAGES.coverWrite);
    contents.set(this.uri, bytes);
  }
  open() {
    const bytes = contents.get(this.uri);
    if (!bytes) throw new Error(TEST_ERROR_MESSAGES.fileRead);
    return {
      size: bytes.length,
      offset: 0,
      async readBytes(length) {
        const chunk = bytes.subarray(this.offset, this.offset + length);
        this.offset += chunk.length;
        return chunk;
      },
      close() {},
    };
  }
}

globalThis.__bookImportTestFileSystem = {
  File: TestFile,
  Directory: TestDirectory,
  Paths: { document: '/documents' },
  FileMode: { ReadOnly: 'r' },
};

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-file-system') {
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(
          'export const { File, Directory, Paths, FileMode } = globalThis.__bookImportTestFileSystem;',
        )}`,
      };
    }
    if (specifier === 'expo-crypto') return nextResolve('node:crypto', context);
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, context);
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot.href)) {
      const target = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(target)) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { saveBookFiles } = await import('../src/services/library-storage.ts');
const { readBookFilesMetadata } = await import('../src/services/book-metadata.ts');

function prepare(t) {
  contents.clear();
  directories.clear();
  failedCopies.clear();
  failCoverWrite = false;
  t.mock.method(console, 'warn', () => {});
}

function audioFile(name) {
  const file = { uri: `/cache/${name}`, name, cover: null };
  contents.set(file.uri, new Uint8Array([1, 2, 3]));
  return file;
}

test('a failed copy is removed while valid parts before and after it are saved', async (t) => {
  prepare(t);
  const files = [audioFile('first.mp3'), audioFile('broken.mp3'), audioFile('last.mp3')];
  failedCopies.add(files[1].uri);
  const result = await saveBookFiles('account', { title: 'Book', author: 'Author', files });

  assert.deepEqual(
    result.files.map((file) => file.name),
    ['first.mp3', 'last.mp3'],
  );
  assert.deepEqual(result.skippedFiles, [{ name: files[1].name, uri: files[1].uri }]);
  const destinations = [...contents.keys()].filter((uri) => uri.startsWith(result.directoryUri));
  assert.equal(destinations.length, 2);
  for (const file of files) assert.ok(contents.has(file.uri));
});

test('a book with no successful copies leaves no book directory', async (t) => {
  prepare(t);
  const file = audioFile('broken.mp3');
  failedCopies.add(file.uri);
  const result = await saveBookFiles('account', { title: 'Book', author: 'Author', files: [file] });

  assert.equal(result, null);
  assert.deepEqual([...directories], ['/documents/library/account/books']);
  assert.deepEqual([...contents.keys()], [file.uri]);
});

test('a failed cover write preserves the audio and removes the partial image', async (t) => {
  prepare(t);
  const file = audioFile('part.mp3');
  file.cover = { format: 'image/jpeg', data: new Uint8Array([1, 2]) };
  failCoverWrite = true;
  const result = await saveBookFiles('account', { title: 'Book', author: 'Author', files: [file] });

  assert.equal(result.files.length, 1);
  assert.equal(result.coverUri, null);
  assert.equal(result.coverRelativePath, null);
  assert.ok(contents.has(result.files[0].uri));
  assert.ok(!contents.has(`${result.directoryUri}/cover.jpg`));
});

test('metadata errors skip only the unreadable files', async (t) => {
  prepare(t);
  const good = audioFile('good.mp3');
  contents.set(good.uri, await readFile(new URL('../assets/audio/mag.mp3', import.meta.url)));
  const bad = { uri: '/cache/missing.mp3', name: 'missing.mp3' };
  const result = await readBookFilesMetadata([bad, good, bad]);

  assert.equal(result.length, 1);
  assert.equal(result[0].uri, good.uri);
  assert.ok(result[0].duration > 0);
  assert.equal(console.warn.mock.callCount(), 2);
});

test('an import cancelled after a native copy rolls back its files and preserves the sources', async (t) => {
  prepare(t);
  const files = [audioFile('first.mp3'), audioFile('second.mp3')];
  const cancelled = new Error('Simulated account change');
  const assertActive = () => {
    if ([...contents.keys()].some((uri) => uri.startsWith('/documents/'))) throw cancelled;
  };
  await assert.rejects(
    saveBookFiles('account', { title: 'Book', author: 'Author', files }, undefined, assertActive),
    cancelled,
  );
  assert.deepEqual(
    [...contents.keys()],
    files.map((file) => file.uri),
  );
  assert.deepEqual([...directories], ['/documents/library/account/books']);
});
