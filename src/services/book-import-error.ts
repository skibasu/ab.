import { BOOK_IMPORT_CONFIG, type BookImportConfig } from '@/constants/book-import-config';
import { APP_ERROR_CODES, BOOK_IMPORT_ERROR_MESSAGES } from '@/constants/errors';

export type BookImportErrorCode = keyof typeof BOOK_IMPORT_ERROR_MESSAGES;

export type ImportLimit = Exclude<keyof BookImportConfig, 'chunkBytes' | 'diskReserveBytes'>;
export type ImportLimitDetails = { limit: ImportLimit; maximum: number; actual?: number };

export class BookImportError extends Error {
  readonly code: BookImportErrorCode;
  readonly details?: ImportLimitDetails;

  constructor(code: BookImportErrorCode, cause?: unknown, details?: ImportLimitDetails) {
    super(BOOK_IMPORT_ERROR_MESSAGES[code], { cause });
    this.name = 'BookImportError';
    this.code = code;
    this.details = details;
  }
}

/** Async imports can outlive their constructor module during Fast Refresh. */
export function isBookImportError(error: unknown): error is BookImportError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Record<string, unknown>;
  if (
    candidate.name !== 'BookImportError' ||
    typeof candidate.code !== 'string' ||
    !Object.hasOwn(BOOK_IMPORT_ERROR_MESSAGES, candidate.code)
  )
    return false;
  if (candidate.details === undefined) return true;
  if (typeof candidate.details !== 'object' || candidate.details === null) return false;
  const details = candidate.details as Record<string, unknown>;
  return (
    typeof details.limit === 'string' &&
    Object.hasOwn(BOOK_IMPORT_CONFIG, details.limit) &&
    details.limit !== 'chunkBytes' &&
    details.limit !== 'diskReserveBytes' &&
    typeof details.maximum === 'number' &&
    Number.isFinite(details.maximum) &&
    details.maximum >= 0 &&
    (details.actual === undefined ||
      (typeof details.actual === 'number' &&
        Number.isFinite(details.actual) &&
        details.actual >= 0))
  );
}

export function assertImportNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new BookImportError(APP_ERROR_CODES.importCancelled);
}

export function assertImportLimit(
  actual: number,
  limit: ImportLimit,
  config: BookImportConfig = BOOK_IMPORT_CONFIG,
): void {
  if (actual > config[limit]) {
    throw new BookImportError(APP_ERROR_CODES.importLimitExceeded, undefined, {
      limit,
      actual,
      maximum: config[limit],
    });
  }
}
