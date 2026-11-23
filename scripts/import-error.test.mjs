import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/'))
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, sourceRoot).href, context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot.href)) {
      const target = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(target)) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { getImportErrorContent, getImportErrorParams } =
  await import('../src/utils/import-error-content.ts');
const { assertImportLimit, BookImportError } = await import('../src/services/book-import-error.ts');
const { APP_ERROR_CODES: codes } = await import('../src/constants/errors.ts');
const { BOOK_IMPORT_CONFIG: limits } = await import('../src/constants/book-import-config.ts');
const { IMPORT_ERROR_CONTENT: copy } = await import('../src/constants/import-error.ts');

test('each supported failure has a distinct user-facing message', () => {
  for (const code of [
    codes.importInvalidZip,
    codes.importEncryptedZip,
    codes.importUnsupportedZip,
    codes.importNoAudio,
    codes.importNoSpace,
    codes.importCleanupFailed,
    codes.importNativeBuildRequired,
    codes.importFileReadFailed,
    codes.importFileSaveFailed,
  ]) {
    assert.equal(getImportErrorContent({ code }).message, copy.messages[code]);
    assert.notEqual(getImportErrorContent({ code }).message, copy.messages[codes.importFailed]);
  }
});

test('limit errors carry the actual value and display the active configuration', () => {
  for (const limit of Object.keys(copy.limits)) {
    const actual = limits[limit] + 1;
    let error;
    try {
      assertImportLimit(actual, limit);
    } catch (caught) {
      error = caught;
    }
    assert.equal(error.code, codes.importLimitExceeded);
    assert.deepEqual(error.details, { limit, maximum: limits[limit], actual });
    const params = getImportErrorParams(error, 'audio/mpeg');
    assert.equal(params.limit, limit);
    assert.equal(params.actual, String(actual));
    const result = getImportErrorContent(params);
    assert.notEqual(result.message, copy.messages[codes.importLimitExceeded]);
    assert.equal(result.message.includes('undefined'), false);
    assertImportLimit(limits[limit], limit);
  }
  const message = getImportErrorContent({
    code: codes.importLimitExceeded,
    limit: 'maxDirectMp3Bytes',
    actual: '8500000000',
  }).message;
  assert.match(message, /8\.5 GB/);
  assert.match(message, new RegExp(`${limits.maxDirectMp3Bytes / 1e9} GB`));
});

test('routing includes only safe error context and preserves partial-import information', () => {
  const unknown = new Error('/private/secret/audio.mp3: internal failure');
  const params = getImportErrorParams(unknown, 'application/zip', 2);
  assert.deepEqual(params, { code: codes.importFailed, type: 'application/zip', partial: 'true' });
  assert.equal(getImportErrorContent(params).partial, true);
  assert.equal(JSON.stringify(params).includes('secret'), false);
  assert.equal(
    getImportErrorParams(new BookImportError(codes.importInvalidZip), 'application/zip').code,
    codes.importInvalidZip,
  );
});

test('invalid deep-link parameters fall back safely without rendering raw errors', () => {
  for (const code of ['unknown/error', '__proto__', 'constructor']) {
    assert.equal(getImportErrorContent({ code }).message, copy.messages[codes.importFailed]);
  }
  for (const limit of ['__proto__', 'diskReserveBytes', 'chunkBytes', 'unknown']) {
    assert.equal(
      getImportErrorContent({ code: codes.importLimitExceeded, limit, actual: 'Infinity' }).message,
      copy.messages[codes.importLimitExceeded],
    );
  }
  assert.equal(
    getImportErrorContent({
      code: codes.importLimitExceeded,
      limit: 'maxMp3Files',
      actual: 'NaN',
    }).message.includes('NaN'),
    false,
  );
  assert.equal(getImportErrorContent({ partial: 'anything' }).partial, false);
});

test('a small overrun is not rounded to the same displayed size as the limit', () => {
  const actual = limits.maxDirectMp3Bytes + 1;
  const message = getImportErrorContent({
    code: codes.importLimitExceeded,
    limit: 'maxDirectMp3Bytes',
    actual: String(actual),
  }).message;
  assert.match(message, new RegExp(actual.toLocaleString('en-US') + ' bytes'));
});

const { reportBookImportFailure } = await import('../src/services/report-book-import-failure.ts');
const { isBookImportError } = await import('../src/services/book-import-error.ts');
test('limit exceptions from an earlier module instance log information without a stack or error overlay', (t) => {
  class PreviousImportError extends Error {
    constructor() {
      super('Previous module instance');
      this.name = 'BookImportError';
      this.code = codes.importLimitExceeded;
      this.details = {
        limit: 'maxDirectMp3Bytes',
        maximum: limits.maxDirectMp3Bytes,
        actual: limits.maxDirectMp3Bytes + 1,
      };
    }
  }
  const error = new PreviousImportError();
  assert.equal(error instanceof BookImportError, false);
  assert.equal(isBookImportError(error), true);
  const info = t.mock.method(console, 'info', () => {});
  const failure = t.mock.method(console, 'error', () => {});
  assert.equal(reportBookImportFailure(error, 'audio/mpeg'), true);
  assert.equal(failure.mock.callCount(), 0);
  assert.equal(info.mock.callCount(), 1);
  assert.deepEqual(info.mock.calls[0].arguments[1], { type: 'audio/mpeg', ...error.details });
  assert.equal(
    info.mock.calls[0].arguments.some((value) => value instanceof Error),
    false,
  );
  assert.equal(getImportErrorParams(error, 'audio/mpeg').code, codes.importLimitExceeded);
});

test('cancellation stays silent while unexpected faults retain their original error for diagnosis', (t) => {
  const info = t.mock.method(console, 'info', () => {});
  const failure = t.mock.method(console, 'error', () => {});
  assert.equal(
    reportBookImportFailure(new BookImportError(codes.importCancelled), 'application/zip'),
    false,
  );
  assert.equal(failure.mock.callCount(), 0);
  const unexpected = new Error('Unexpected failure fixture');
  assert.equal(reportBookImportFailure(unexpected, 'application/zip'), true);
  assert.equal(failure.mock.calls[0].arguments[1], unexpected);
  assert.equal(info.mock.callCount(), 0);
  assert.equal(isBookImportError({ name: 'BookImportError', code: 'unknown' }), false);
  assert.equal(
    isBookImportError({
      name: 'BookImportError',
      code: codes.importLimitExceeded,
      details: { limit: '__proto__', maximum: 1 },
    }),
    false,
  );
});
