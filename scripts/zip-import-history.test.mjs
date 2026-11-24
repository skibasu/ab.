import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
const storedFiles = new Map();
let nextDatabase;
function adapter(db) {
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async getFirstAsync(sql, ...params) {
      return db.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql, ...params) {
      return db.prepare(sql).all(...params);
    },
    async runAsync(sql, ...params) {
      return db.prepare(sql).run(...params);
    },
    async closeAsync() {
      db.close();
    },
    async withTransactionAsync(callback) {
      db.exec('BEGIN');
      try {
        await callback();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
globalThis.__zipHistoryMocks = {
  openDatabaseAsync: async () => adapter(nextDatabase),
  Paths: { document: '/documents' },
  File: class {
    constructor(base, path) {
      this.uri = `${base}/${path}`;
    }
    get exists() {
      return storedFiles.has(this.uri);
    }
    get size() {
      return storedFiles.get(this.uri)?.size ?? 0;
    }
    get modificationTime() {
      return storedFiles.get(this.uri)?.modifiedAt ?? null;
    }
  },
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const names = { 'expo-sqlite': 'openDatabaseAsync', 'expo-file-system': 'File,Paths' };
    if (names[specifier])
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent(`export const {${names[specifier]}}=globalThis.__zipHistoryMocks;`)}`,
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

for (const version of [0, 1, 2, 3]) {
  await test(`schema ${version} migrates to playback schema without losing books or tracks`, async () => {
    const db = (nextDatabase = new DatabaseSync(':memory:'));
    if (version) {
      db.exec(`
        CREATE TABLE books (id TEXT PRIMARY KEY, userId TEXT, title TEXT, author TEXT, duration REAL, coverPath TEXT NOT NULL DEFAULT '', createdAt INTEGER);
        CREATE TABLE tracks (id TEXT PRIMARY KEY, bookId TEXT REFERENCES books(id) ON DELETE CASCADE, title TEXT, filePath TEXT, duration REAL, position INTEGER);
        INSERT INTO books VALUES ('old', 'account-a', 'Title', 'Author', 10, 'custom-cover.jpg', 0);
        INSERT INTO tracks VALUES ('old-track', 'old', 'Part', 'old.mp3', 10, 0);
        PRAGMA user_version = ${version};
      `);
    }
    if (version === 3) {
      db.exec(`CREATE TABLE zip_import_receipts (
        userId TEXT NOT NULL, digest TEXT NOT NULL, zipBytes INTEGER NOT NULL,
        tracksJson TEXT NOT NULL, PRIMARY KEY (userId, digest)
      );
      INSERT INTO zip_import_receipts VALUES ('account-a', 'existing-digest', 100, '[]');`);
    }
    const { initializeLibraryDatabase } = await import(
      `../src/services/library-database.ts?migration=${version}`
    );
    await initializeLibraryDatabase();
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 4);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'zip_import_receipts'").get()
        .n,
      1,
    );
    if (version) {
      assert.equal(db.prepare('SELECT coverPath FROM books').get().coverPath, 'custom-cover.jpg');
      assert.equal(db.prepare('SELECT id FROM tracks').get().id, 'old-track');
      const book = db.prepare('SELECT lastPlayedAt, lastPlayedTrackId FROM books').get();
      assert.equal(book.lastPlayedAt, null);
      assert.equal(book.lastPlayedTrackId, null);
      const track = db.prepare('SELECT * FROM tracks').get();
      assert.equal(track.positionSeconds, 0);
      assert.equal(track.completed, 0);
      assert.equal(track.lastPlayedAt, null);
      assert.equal(track.updatedAt, null);
    }
    if (version === 3) {
      assert.equal(
        db.prepare('SELECT digest FROM zip_import_receipts').get().digest,
        'existing-digest',
      );
    }
    assert.ok(
      db.prepare("SELECT name FROM sqlite_master WHERE name = 'books_by_last_played'").get(),
    );
    db.close();
  });
}

const db = new DatabaseSync(':memory:');
nextDatabase = db;
const { initializeLibraryDatabase } = await import('../src/services/library-database.ts');
await initializeLibraryDatabase();
const { rememberCompletedZip, hasCompletedZip } =
  await import('../src/services/zip-import-history.ts');
const active = () => {};
function prepare() {
  db.exec('DELETE FROM books; DELETE FROM zip_import_receipts;');
  db.prepare(
    'INSERT INTO books (id, userId, title, author, duration, coverPath, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run('book-a', 'account-a', 'Book', 'Author', 10, 'default', 0);
  db.prepare(
    'INSERT INTO tracks (id, bookId, title, filePath, duration, position) VALUES (?, ?, ?, ?, ?, ?)',
  ).run('track-a', 'book-a', 'Part', 'part.mp3', 10, 0);
  storedFiles.clear();
  storedFiles.set('/documents/part.mp3', { size: 100, modifiedAt: 1234 });
}

test('completed ZIP is remembered persistently per account and exact archive identity', async () => {
  prepare();
  await rememberCompletedZip('account-a', 'sha256-a', 200, ['book-a'], active);
  assert.equal(await hasCompletedZip('account-a', 'sha256-a', 200, active), true);
  assert.equal(await hasCompletedZip('account-b', 'sha256-a', 200, active), false);
  assert.equal(await hasCompletedZip('account-a', 'sha256-b', 200, active), false);
  assert.equal(await hasCompletedZip('account-a', 'sha256-a', 201, active), false);
});

test('book deletion, missing audio and changed audio invalidate a receipt', async () => {
  for (const invalidate of [
    () => db.exec('DELETE FROM books'),
    () => storedFiles.clear(),
    () => storedFiles.set('/documents/part.mp3', { size: 101, modifiedAt: 1234 }),
    () => storedFiles.set('/documents/part.mp3', { size: 100, modifiedAt: 9999 }),
  ]) {
    prepare();
    await rememberCompletedZip('account-a', 'sha256-a', 200, ['book-a'], active);
    invalidate();
    assert.equal(await hasCompletedZip('account-a', 'sha256-a', 200, active), false);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM zip_import_receipts').get().n, 0);
  }
});

test('appending another part preserves a receipt for the original archive', async () => {
  prepare();
  await rememberCompletedZip('account-a', 'sha256-a', 200, ['book-a'], active);
  db.prepare(
    'INSERT INTO tracks (id, bookId, title, filePath, duration, position) VALUES (?, ?, ?, ?, ?, ?)',
  ).run('track-b', 'book-a', 'Part 2', 'part2.mp3', 10, 1);
  assert.equal(await hasCompletedZip('account-a', 'sha256-a', 200, active), true);
});

test('missing dependencies and malformed history cannot falsely skip an import', async () => {
  prepare();
  await rememberCompletedZip('account-a', 'sha256-a', 200, ['missing-book'], active);
  assert.equal(await hasCompletedZip('account-a', 'sha256-a', 200, active), false);
  for (const json of ['invalid', 'null', '[null]', '[]']) {
    db.prepare('INSERT OR REPLACE INTO zip_import_receipts VALUES (?, ?, ?, ?)').run(
      'account-a',
      'sha256-a',
      200,
      json,
    );
    assert.equal(await hasCompletedZip('account-a', 'sha256-a', 200, active), false);
  }
});

test('account change during receipt persistence rolls back the record', async () => {
  prepare();
  let calls = 0;
  await assert.rejects(
    rememberCompletedZip('account-a', 'sha256-a', 200, ['book-a'], () => {
      if (++calls === 3) throw new Error('account changed');
    }),
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM zip_import_receipts').get().n, 0);
});

const { getBook, getBooks, listBooks, saveBook, updateBook, updateTrack } =
  await import('../src/services/book-repository.ts');

test('repository reads playback state consistently and converts completed to a boolean', async () => {
  prepare();
  db.prepare('UPDATE books SET lastPlayedAt = ?, lastPlayedTrackId = ? WHERE id = ?').run(
    2000,
    'track-a',
    'book-a',
  );
  db.prepare(
    'UPDATE tracks SET positionSeconds = ?, completed = ?, lastPlayedAt = ?, updatedAt = ? WHERE id = ?',
  ).run(4.5, 1, 2000, 2100, 'track-a');

  const book = await getBook('account-a', 'book-a');
  const books = await getBooks('account-a');
  assert.deepEqual(books, [book]);
  assert.equal(book.lastPlayedAt, 2000);
  assert.equal(book.lastPlayedTrackId, 'track-a');
  assert.equal(book.tracks[0].positionSeconds, 4.5);
  assert.equal(book.tracks[0].completed, true);
  assert.equal(book.tracks[0].lastPlayedAt, 2000);
  assert.equal(book.tracks[0].updatedAt, 2100);
  assert.equal((await listBooks('account-a'))[0].lastPlayedTrackId, 'track-a');
  assert.equal(await getBook('account-b', 'book-a'), null);
  assert.deepEqual(await getBooks('account-b'), []);

  db.prepare('UPDATE tracks SET completed = 0').run();
  assert.equal((await getBook('account-a', 'book-a')).tracks[0].completed, false);
  assert.equal((await getBooks('account-a'))[0].tracks[0].completed, false);
});

test('new imports receive empty playback state and appending tracks preserves saved progress', async () => {
  prepare();
  const saved = {
    bookId: 'new-book',
    userId: 'account-a',
    title: 'New book',
    author: 'Author',
    coverRelativePath: null,
    files: [
      {
        id: 'new-track',
        title: 'New part',
        name: 'new.mp3',
        relativePath: 'new.mp3',
        duration: 20,
        disk: {},
        track: {},
      },
    ],
  };
  await saveBook(saved);
  const book = await getBook('account-a', 'new-book');
  assert.equal(book.lastPlayedAt, null);
  assert.equal(book.lastPlayedTrackId, null);
  assert.equal(book.tracks[0].positionSeconds, 0);
  assert.equal(book.tracks[0].completed, false);
  assert.equal(book.tracks[0].lastPlayedAt, null);
  assert.equal(book.tracks[0].updatedAt, null);

  db.prepare('UPDATE books SET lastPlayedAt = 1000, lastPlayedTrackId = ? WHERE id = ?').run(
    'new-track',
    'new-book',
  );
  db.prepare(
    'UPDATE tracks SET positionSeconds = 7, completed = 1, lastPlayedAt = 1000, updatedAt = 1001 WHERE id = ?',
  ).run('new-track');
  await saveBook({ ...saved, files: [{ ...saved.files[0], id: 'appended-track' }] }, true);
  const appended = await getBook('account-a', 'new-book');
  assert.equal(appended.lastPlayedAt, 1000);
  assert.equal(appended.lastPlayedTrackId, 'new-track');
  assert.equal(appended.tracks[0].positionSeconds, 7);
  assert.equal(appended.tracks[0].completed, true);
  assert.equal(appended.tracks[0].updatedAt, 1001);
  assert.equal(appended.tracks[1].positionSeconds, 0);
  assert.equal(appended.tracks[1].completed, false);
  assert.equal(appended.tracks[1].position, 1);
});

test('playback schema rejects negative positions and invalid completed values', () => {
  prepare();
  assert.throws(() => db.exec('UPDATE tracks SET positionSeconds = -1'), /CHECK constraint failed/);
  assert.throws(() => db.exec('UPDATE tracks SET completed = 2'), /CHECK constraint failed/);
});

test('updateBook updates playback fields and only accepts a track belonging to the owned book', async () => {
  prepare();
  const before = await getBook('account-a', 'book-a');
  assert.equal(
    await updateBook('account-a', 'book-a', {
      lastPlayedAt: 3000,
      lastPlayedTrackId: 'track-a',
    }),
    true,
  );
  const updated = await getBook('account-a', 'book-a');
  assert.deepEqual(updated, { ...before, lastPlayedAt: 3000, lastPlayedTrackId: 'track-a' });
  assert.equal(
    await updateBook('account-b', 'book-a', {
      lastPlayedAt: 4000,
      lastPlayedTrackId: 'track-a',
    }),
    false,
  );
  assert.equal(
    await updateBook('account-a', 'missing-book', {
      lastPlayedAt: 4000,
      lastPlayedTrackId: null,
    }),
    false,
  );
  assert.equal(
    await updateBook('account-a', 'book-a', {
      lastPlayedAt: 4000,
      lastPlayedTrackId: 'missing-track',
    }),
    false,
  );

  db.exec(`INSERT INTO books (id, userId, title, author, createdAt) VALUES ('other-book', 'account-a', 'Other', 'Author', 0);
    INSERT INTO tracks (id, bookId, title, filePath, position) VALUES ('other-track', 'other-book', 'Other', 'other.mp3', 0);`);
  assert.equal(
    await updateBook('account-a', 'book-a', {
      lastPlayedAt: 4000,
      lastPlayedTrackId: 'other-track',
    }),
    false,
  );
  assert.deepEqual(await getBook('account-a', 'book-a'), updated);
  assert.equal(
    await updateBook('account-a', 'book-a', {
      lastPlayedAt: null,
      lastPlayedTrackId: null,
    }),
    true,
  );
  assert.deepEqual(await getBook('account-a', 'book-a'), before);
});

test('updateTrack updates playback state, preserves metadata and checks the owning user and book', async () => {
  prepare();
  const before = await getBook('account-a', 'book-a');
  const changes = { positionSeconds: 3.25, completed: true, lastPlayedAt: 3000, updatedAt: 3100 };
  assert.equal(await updateTrack('account-a', 'book-a', 'track-a', changes), true);
  const updated = await getBook('account-a', 'book-a');
  assert.deepEqual(updated, { ...before, tracks: [{ ...before.tracks[0], ...changes }] });
  const wrongChanges = { ...changes, positionSeconds: 9 };
  assert.equal(await updateTrack('account-b', 'book-a', 'track-a', wrongChanges), false);
  assert.equal(await updateTrack('account-a', 'missing-book', 'track-a', wrongChanges), false);
  assert.equal(await updateTrack('account-a', 'book-a', 'missing-track', wrongChanges), false);
  assert.deepEqual(await getBook('account-a', 'book-a'), updated);

  const reset = { positionSeconds: 0, completed: false, lastPlayedAt: null, updatedAt: null };
  assert.equal(await updateTrack('account-a', 'book-a', 'track-a', reset), true);
  assert.deepEqual(await getBook('account-a', 'book-a'), before);
});

test('playback updates reject invalid positions and timestamps without writing data', async () => {
  prepare();
  const before = await getBook('account-a', 'book-a');
  const changes = { positionSeconds: 2, completed: false, lastPlayedAt: 3000, updatedAt: 3100 };
  for (const positionSeconds of [-1, NaN, Infinity]) {
    await assert.rejects(
      updateTrack('account-a', 'book-a', 'track-a', { ...changes, positionSeconds }),
      RangeError,
    );
  }
  for (const timestamp of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(
      updateBook('account-a', 'book-a', { lastPlayedAt: timestamp, lastPlayedTrackId: 'track-a' }),
      RangeError,
    );
    for (const field of ['lastPlayedAt', 'updatedAt']) {
      await assert.rejects(
        updateTrack('account-a', 'book-a', 'track-a', { ...changes, [field]: timestamp }),
        RangeError,
      );
    }
  }
  assert.deepEqual(await getBook('account-a', 'book-a'), before);
});
