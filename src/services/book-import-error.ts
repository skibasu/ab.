import { APP_ERROR_CODES, BOOK_IMPORT_ERROR_MESSAGES } from '@/constants/errors';

export type BookImportErrorCode = keyof typeof BOOK_IMPORT_ERROR_MESSAGES;

export class BookImportError extends Error {
  readonly code: BookImportErrorCode;

  constructor(code: BookImportErrorCode, cause?: unknown) {
    super(BOOK_IMPORT_ERROR_MESSAGES[code], { cause });
    this.name = 'BookImportError';
    this.code = code;
  }
}

export function assertImportNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new BookImportError(APP_ERROR_CODES.importCancelled);
}
