/** Shared reader contract used by the Expo file reader and the metadata tokenizer. */
export type AudioFileReader = {
  /** Total file size in bytes. */
  size: number;
  /** Reads up to length bytes at an absolute byte position; may return fewer at EOF. */
  read: (position: number, length: number) => Promise<Uint8Array>;
  /** Releases the file handle; safe to call more than once. */
  close: () => void;
};
