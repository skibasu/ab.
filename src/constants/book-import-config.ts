/** Decimal byte limits from spec.md. All import limits and buffer sizes live here. */
export const BOOK_IMPORT_CONFIG = {
  maxZipFiles: 1,
  maxZipBytes: 4_000_000_000,
  maxMp3Files: 600,
  maxDirectMp3Bytes: 2_000_000_000,
  maxArchiveEntries: 2_000,
  maxUncompressedBytes: 7_000_000_000,
  diskReserveBytes: 64_000_000,
  chunkBytes: 64 * 1024,
  // Also bound allocation for an unusually large or malicious central directory.
  maxMetadataReadBytes: 16_000_000,
};

export type BookImportConfig = typeof BOOK_IMPORT_CONFIG;
