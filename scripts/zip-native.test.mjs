import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';

const sourceRoot = new URL('../src/', import.meta.url);
let native;
globalThis.__bookZipNative = () => native;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'expo-modules-core')
      return {
        shortCircuit: true,
        url: `data:text/javascript,${encodeURIComponent('export const requireOptionalNativeModule = () => globalThis.__bookZipNative();')}`,
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
const { createNativeZipExtractor } = await import('../src/services/zip-native.ios.ts');
const { APP_ERROR_CODES: codes } = await import('../src/constants/errors.ts');
const { BOOK_IMPORT_CONFIG: limits } = await import('../src/constants/book-import-config.ts');
const entries = [
  { size: 100, checksum: 123, directory: false, audio: true, filename: 'book/part.mp3' },
  { size: 9, checksum: 456, directory: false, audio: false, filename: 'cover.jpg' },
];
const makeExtractor = (signal) =>
  createNativeZipExtractor('file:///work/source.zip', 'file:///work/', signal);

test('an old iOS build reports a specific build-required error', async () => {
  native = undefined;
  await assert.rejects(makeExtractor()(entries), { code: codes.importNativeBuildRequired });
});

test('only the manifest crosses the bridge and outputs get generated filenames', async () => {
  let begun;
  native = {
    begin(id) {
      begun = id;
    },
    cancel() {
      assert.fail('Unexpected cancellation');
    },
    async extract(id, archive, destination, manifest, maxBytes, chunkBytes) {
      assert.equal(id, begun);
      assert.equal(archive, 'file:///work/source.zip');
      assert.equal(destination, 'file:///work/');
      assert.equal(maxBytes, limits.maxUncompressedBytes);
      assert.equal(chunkBytes, limits.chunkBytes);
      assert.equal(manifest[0].size, 100);
      assert.equal(manifest[0].checksum, 123);
      assert.match(manifest[0].output, /^[\da-f-]+\.mp3$/);
      assert.equal(manifest[1].output, null);
      return null;
    },
  };
  const files = await makeExtractor()(entries);
  assert.equal(files.length, 1);
  assert.equal(files[0].name, 'part.mp3');
  assert.match(files[0].uri, /^file:\/\/\/work\/[\da-f-]+\.mp3$/);
});

test('cancellation waits for native completion before allowing workspace cleanup', async () => {
  const controller = new AbortController();
  let release;
  let cancelled = false;
  native = {
    begin() {},
    cancel() {
      cancelled = true;
    },
    extract() {
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  };
  let settled = false;
  const result = makeExtractor(controller.signal)(entries);
  const rejection = assert.rejects(result, { code: codes.importCancelled });
  result.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  controller.abort();
  await Promise.resolve();
  assert.equal(cancelled, true);
  assert.equal(settled, false);
  release('cancelled');
  await rejection;
});

test('native statuses retain controlled import error codes', async () => {
  for (const [status, code] of Object.entries({
    invalid: codes.importInvalidZip,
    cancelled: codes.importCancelled,
    limit: codes.importLimitExceeded,
    noSpace: codes.importNoSpace,
  })) {
    native = {
      begin() {},
      cancel() {},
      async extract() {
        return status;
      },
    };
    await assert.rejects(makeExtractor()(entries), { code });
  }
});
