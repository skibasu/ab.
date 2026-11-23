import { APP_ERROR_CODES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import type { ImportFileType } from '@/utils/import-error-content';
import { isBookImportError } from './book-import-error';

/** Returns whether the failure should open ImportError; cancellation remains silent. */
export function reportBookImportFailure(error: unknown, type: ImportFileType): boolean {
  if (isBookImportError(error)) {
    if (error.code === APP_ERROR_CODES.importCancelled) return false;
    if (error.code === APP_ERROR_CODES.importLimitExceeded) {
      console.info(LOG_MESSAGES.bookImport.limitExceeded, { type, ...error.details });
      return true;
    }
  }
  console.error(LOG_MESSAGES.bookImport.preparationFailed, error);
  return true;
}
