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

for (const version of [0, 1, 2]) {
  await test(`schema ${version} migrates to ZIP history without losing books or tracks`, async () => {
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
    const { initializeLibraryDatabase } = await import(
      `../src/services/library-database.ts?migration=${version}`
    );
    await initializeLibraryDatabase();
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'zip_import_receipts'").get()
        .n,
      1,
    );
    if (version) {
      assert.equal(db.prepare('SELECT coverPath FROM books').get().coverPath, 'custom-cover.jpg');
      assert.equal(db.prepare('SELECT id FROM tracks').get().id, 'old-track');
    }
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
  db.prepare('INSERT INTO books VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    'book-a',
    'account-a',
    'Book',
    'Author',
    10,
    'default',
    0,
  );
  db.prepare('INSERT INTO tracks VALUES (?, ?, ?, ?, ?, ?)').run(
    'track-a',
    'book-a',
    'Part',
    'part.mp3',
    10,
    0,
  );
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
  db.prepare('INSERT INTO tracks VALUES (?, ?, ?, ?, ?, ?)').run(
    'track-b',
    'book-a',
    'Part 2',
    'part2.mp3',
    10,
    1,
  );
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
