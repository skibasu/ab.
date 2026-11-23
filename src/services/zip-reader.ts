// The native entry includes a JavaScript inflater instead of relying on WASM or workers.
import { configure, Reader, Writer, ZipReader, type Entry } from '@zip.js/zip.js/index-native.js';

import { BOOK_IMPORT_CONFIG, type BookImportConfig } from '@/constants/book-import-config';
import { APP_ERROR_CODES } from '@/constants/errors';
import type { AudioFileReader } from './audio-file-reader.types';
import { assertImportNotAborted, BookImportError } from './book-import-error';

configure({
  useWebWorkers: false,
  useCompressionStream: false,
  chunkSize: BOOK_IMPORT_CONFIG.chunkBytes,
});

export type ZipManifest = {
  entries: number;
  mp3Files: number;
  audioBytes: number;
  totalBytes: number;
};
export type ZipOutput = { write: (bytes: Uint8Array) => Promise<void>; close: () => void };
export type NativeZipEntry = {
  size: number;
  checksum: number;
  directory: boolean;
  audio: boolean;
  filename: string;
};
type ZipOptions = {
  signal?: AbortSignal;
  limits?: BookImportConfig;
  onManifest?: (manifest: ZipManifest) => void | Promise<void>;
  openOutput: (filename: string) => ZipOutput;
  extractEntries?: (entries: NativeZipEntry[]) => Promise<void>;
  onProgress?: (fraction: number) => void;
  onAudioExtracted?: () => Promise<void>;
};

class ZipRangeReader extends Reader<null> {
  private readonly source: AudioFileReader;
  private readonly limits: BookImportConfig;
  private readonly signal?: AbortSignal;

  constructor(source: AudioFileReader, limits: BookImportConfig, signal?: AbortSignal) {
    super(null);
    this.source = source;
    this.limits = limits;
    this.signal = signal;
    this.size = source.size;
  }

  override async readUint8Array(offset: number, length: number): Promise<Uint8Array> {
    assertImportNotAborted(this.signal);
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(length) ||
      length < 0
    ) {
      throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
    }
    if (length > this.limits.maxMetadataReadBytes) {
      throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
    }
    const bytes = await this.source.read(offset, length);
    assertImportNotAborted(this.signal);
    if (bytes.length !== Math.min(length, this.size - offset)) {
      throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
    }
    return bytes;
  }
}

class ZipOutputWriter extends Writer<void> {
  written = 0;
  private readonly writeChunk: (bytes: Uint8Array) => Promise<void>;

  constructor(writeChunk: (bytes: Uint8Array) => Promise<void>) {
    super();
    this.writeChunk = writeChunk;
  }

  override async writeUint8Array(bytes: Uint8Array): Promise<void> {
    await this.writeChunk(bytes);
    this.written += bytes.length;
  }

  override getData(): void {}
}

function isAudio(entry: Entry): boolean {
  // Finder metadata and hidden files are not audiobook parts. Nested ZIPs are never expanded.
  return (
    !entry.directory &&
    /\.mp3$/i.test(entry.filename) &&
    !entry.filename.split('/').some((part) => part.startsWith('.') || part === '__MACOSX')
  );
}

function validateEntry(entry: Entry): void {
  const path = entry.filename.replace(/\/$/, '');
  if (
    !path ||
    /[\\\x00-\x1f:]/.test(path) ||
    path.startsWith('/') ||
    entry.symlink ||
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    !Number.isSafeInteger(entry.uncompressedSize) ||
    entry.uncompressedSize < 0 ||
    !Number.isSafeInteger(entry.compressedSize) ||
    entry.compressedSize < 0 ||
    (entry.directory && entry.uncompressedSize !== 0)
  )
    throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
  if (entry.encrypted) throw new BookImportError(APP_ERROR_CODES.importEncryptedZip);
  if (
    !entry.directory &&
    (!Number.isInteger(entry.crc32) || entry.crc32! < 0 || entry.crc32! > 0xffffffff)
  )
    throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    throw new BookImportError(APP_ERROR_CODES.importUnsupportedZip);
  }
}

/** Validates the entire archive before opening destinations; never buffers a whole audio file. */
export async function extractZip(
  source: AudioFileReader,
  options: ZipOptions,
): Promise<ZipManifest> {
  const limits = options.limits ?? BOOK_IMPORT_CONFIG;
  assertImportNotAborted(options.signal);
  if (!Number.isSafeInteger(source.size) || source.size <= 0) {
    throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
  }
  if (source.size > limits.maxZipBytes)
    throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
  const zip = new ZipReader(new ZipRangeReader(source, limits, options.signal), {
    strictness: 'strict',
    filenameValidation: 'strict',
    checkCrc32: true,
    checkOverlappingEntry: true,
    useWebWorkers: false,
    useCompressionStream: false,
    signal: options.signal,
  });

  try {
    const entries: Entry[] = [];
    const manifest: ZipManifest = { entries: 0, mp3Files: 0, audioBytes: 0, totalBytes: 0 };
    let allMp3Files = 0;
    for await (const entry of zip.getEntriesGenerator()) {
      assertImportNotAborted(options.signal);
      validateEntry(entry);
      manifest.entries++;
      manifest.totalBytes += entry.uncompressedSize;
      if (!entry.directory && /\.mp3$/i.test(entry.filename)) allMp3Files++;
      if (
        manifest.entries > limits.maxArchiveEntries ||
        allMp3Files > limits.maxMp3Files ||
        manifest.totalBytes > limits.maxUncompressedBytes
      ) {
        throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
      }
      if (isAudio(entry)) {
        manifest.mp3Files++;
        manifest.audioBytes += entry.uncompressedSize;
      }
      entries.push(entry);
    }
    if (!manifest.mp3Files) throw new BookImportError(APP_ERROR_CODES.importNoAudio);
    await options.onManifest?.(manifest);
    if (options.extractEntries) {
      await options.extractEntries(
        entries.map((entry) => ({
          size: entry.uncompressedSize,
          checksum: entry.crc32 ?? 0,
          directory: entry.directory,
          audio: isAudio(entry),
          filename: entry.filename,
        })),
      );
      assertImportNotAborted(options.signal);
      return manifest;
    }
    let totalWritten = 0;
    const firstAudio = entries.find(isAudio)!;
    const extractionOrder = [firstAudio, ...entries.filter((entry) => entry !== firstAudio)];
    for (const entry of extractionOrder) {
      assertImportNotAborted(options.signal);
      if (entry.directory) continue;
      const output = isAudio(entry) ? options.openOutput(entry.filename) : undefined;
      let entryWritten = 0;
      try {
        const writer = new ZipOutputWriter(async (bytes) => {
          assertImportNotAborted(options.signal);
          entryWritten += bytes.length;
          totalWritten += bytes.length;
          if (totalWritten > limits.maxUncompressedBytes) {
            throw new BookImportError(APP_ERROR_CODES.importLimitExceeded);
          }
          if (entryWritten > entry.uncompressedSize) {
            throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
          }
          await output?.write(bytes);
          options.onProgress?.(manifest.totalBytes ? totalWritten / manifest.totalBytes : 1);
        });
        // Non-audio data is discarded, but still inflated and checked against the real size/CRC.
        await entry.getData(writer);
        if (writer.written !== entry.uncompressedSize) {
          throw new BookImportError(APP_ERROR_CODES.importInvalidZip);
        }
      } finally {
        output?.close();
      }
      if (entry === firstAudio) await options.onAudioExtracted?.();
    }
    assertImportNotAborted(options.signal);
    return manifest;
  } catch (error) {
    assertImportNotAborted(options.signal);
    if (error instanceof BookImportError) throw error;
    throw new BookImportError(APP_ERROR_CODES.importInvalidZip, error);
  } finally {
    await zip.close();
  }
}
