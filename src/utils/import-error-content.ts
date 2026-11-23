import { BOOK_IMPORT_CONFIG } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import { IMPORT_ERROR_CONTENT } from '@/constants/import-error';
import { isBookImportError, type ImportLimit } from '@/services/book-import-error';

export type ImportErrorParams = {
  code?: string;
  limit?: string;
  actual?: string;
  partial?: string;
  type?: string;
};
export type ImportFileType = 'audio/mpeg' | 'application/zip';
const byteLimits = new Set<ImportLimit>([
  'maxZipBytes',
  'maxDirectMp3Bytes',
  'maxUncompressedBytes',
  'maxMetadataReadBytes',
]);

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${Number((bytes / 1_000_000_000).toFixed(2))} GB`;
  return `${Number((bytes / 1_000_000).toFixed(2))} MB`;
}

export function getImportErrorContent(params: ImportErrorParams): {
  title: string;
  message: string;
  partial: boolean;
} {
  const messages: Readonly<Record<string, string>> = IMPORT_ERROR_CONTENT.messages;
  let message =
    params.code && Object.hasOwn(messages, params.code)
      ? messages[params.code]
      : messages[APP_ERROR_CODES.importFailed];
  const limit = params.limit as ImportLimit | undefined;
  if (
    params.code === APP_ERROR_CODES.importLimitExceeded &&
    limit &&
    Object.hasOwn(IMPORT_ERROR_CONTENT.limits, limit)
  ) {
    const maximum = BOOK_IMPORT_CONFIG[limit];
    const actual = params.actual === undefined ? undefined : Number(params.actual);
    let actualLabel =
      actual !== undefined && Number.isFinite(actual) && actual >= 0
        ? byteLimits.has(limit)
          ? formatBytes(actual)
          : String(Math.floor(actual))
        : undefined;
    const maximumLabel = byteLimits.has(limit) ? formatBytes(maximum) : String(maximum);
    if (
      actual !== undefined &&
      actual > maximum &&
      byteLimits.has(limit) &&
      actualLabel === maximumLabel
    ) {
      actualLabel = `${actual.toLocaleString('en-US')} bytes`;
    }
    message = IMPORT_ERROR_CONTENT.limits[limit](maximumLabel, actualLabel);
  }
  return { title: IMPORT_ERROR_CONTENT.title, message, partial: params.partial === 'true' };
}

/** Route only allowlisted error data; technical messages, paths and stacks never reach the UI. */
export function getImportErrorParams(
  error: unknown,
  type: ImportFileType,
  savedBooks = 0,
): ImportErrorParams {
  return {
    code: isBookImportError(error) ? error.code : APP_ERROR_CODES.importFailed,
    type,
    ...(isBookImportError(error) && error.details
      ? {
          limit: error.details.limit,
          ...(error.details.actual !== undefined ? { actual: String(error.details.actual) } : {}),
        }
      : {}),
    ...(savedBooks > 0 ? { partial: 'true' } : {}),
  };
}
