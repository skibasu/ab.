/** Decimal byte limits from spec.md. All import limits and buffer sizes live here. */
export const BOOK_IMPORT_CONFIG = {
  maxZipFiles: 1,
  maxZipBytes: 2_000_000_000,
  maxMp3Files: 300,
  maxDirectMp3Bytes: 1_000_000_000,
  maxArchiveEntries: 1_000,
  maxUncompressedBytes: 4_000_000_000,
  diskReserveBytes: 64_000_000,
  chunkBytes: 64 * 1024,
  // Also bound allocation for an unusually large or malicious central directory.
  maxMetadataReadBytes: 16_000_000,
};

export type BookImportConfig = typeof BOOK_IMPORT_CONFIG;
