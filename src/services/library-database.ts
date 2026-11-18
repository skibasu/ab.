import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';

const DATABASE_NAME = 'library.db';
const SCHEMA_VERSION = 2;

let databasePromise: Promise<SQLiteDatabase> | undefined;
let pendingOperation: Promise<unknown> = Promise.resolve();

/** Opens the local database once and applies outstanding schema migrations. */
export function initializeLibraryDatabase(): Promise<SQLiteDatabase> {
  databasePromise ??= openLibraryDatabase().catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

/** Keeps unrelated reads and writes out of each other's transactions. */
export function withLibraryDatabase<T>(
  operation: (database: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const result = pendingOperation.then(async () => operation(await initializeLibraryDatabase()));
  pendingOperation = result.catch(() => undefined);
  return result;
}

async function openLibraryDatabase(): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(DATABASE_NAME);

  try {
    await database.execAsync('PRAGMA foreign_keys = ON;');
    const version = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');

    if (!version || version.user_version > SCHEMA_VERSION) {
      throw new Error(LIBRARY_ERROR_MESSAGES.unsupportedDatabaseVersion);
    }

    if (version.user_version === 0) {
      await database.withTransactionAsync(async () => {
        await database.execAsync(`
          CREATE TABLE books (
            id TEXT PRIMARY KEY NOT NULL,
            userId TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            duration REAL,
            coverPath TEXT NOT NULL DEFAULT '${DEFAULT_BOOK_COVER_PATH}',
            createdAt INTEGER NOT NULL
          );

          CREATE INDEX books_by_user ON books (userId, createdAt, id);

          CREATE TABLE tracks (
            id TEXT PRIMARY KEY NOT NULL,
            bookId TEXT NOT NULL REFERENCES books (id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            filePath TEXT NOT NULL,
            duration REAL,
            position INTEGER NOT NULL,
            UNIQUE (bookId, position)
          );

          PRAGMA user_version = ${SCHEMA_VERSION};
        `);
      });
    } else if (version.user_version === 1) {
      await database.withTransactionAsync(async () => {
        await database.execAsync(`
          ALTER TABLE books RENAME COLUMN coverPath TO previousCoverPath;
          ALTER TABLE books ADD COLUMN coverPath TEXT NOT NULL DEFAULT '${DEFAULT_BOOK_COVER_PATH}';
          UPDATE books SET coverPath = previousCoverPath WHERE trim(previousCoverPath) <> '';
          ALTER TABLE books DROP COLUMN previousCoverPath;
          PRAGMA user_version = ${SCHEMA_VERSION};
        `);
      });
    }

    return database;
  } catch (error) {
    await database.closeAsync().catch(() => undefined);
    throw error;
  }
}
