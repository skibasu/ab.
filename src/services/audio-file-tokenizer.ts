import {
  AbstractTokenizer,
  EndOfStreamError,
  type IRandomAccessFileInfo,
  type IRandomAccessTokenizer,
  type IReadChunkOptions,
} from 'strtok3/core';

import type { AudioFileReader } from './audio-file-reader.types';

const READ_CHUNK_SIZE = 64 * 1024;
// Limits tokenizer-owned token buffers, not the audio file size or total memory usage.
const MAX_METADATA_BYTES = 64 * 1024 * 1024;

/**
 * Adapts byte-range reads to the tokenizer interface expected by music-metadata.
 * Supports seeking to tags at either end of the file and limits disk reads to 64 KB.
 * Closing the tokenizer also closes its reader.
 */
export class AudioFileTokenizer extends AbstractTokenizer implements IRandomAccessTokenizer {
  readonly fileInfo: IRandomAccessFileInfo;
  private readonly reader: AudioFileReader;
  private closed = false;

  constructor(reader: AudioFileReader) {
    super({
      maxBufferSize: MAX_METADATA_BYTES,
      onClose: async () => reader.close(),
    });
    this.reader = reader;
    this.fileInfo = { size: reader.size, mimeType: 'audio/mpeg' };
  }

  // Allows the parser to skip audio payloads and revisit earlier file positions.
  supportsRandomAccess(): boolean {
    return true;
  }

  setPosition(position: number): void {
    this.validateLength(position, 'position');
    this.position = position;
  }

  /** Reads bytes and advances the parser cursor by the number actually read. */
  async readBuffer(buffer: Uint8Array, options?: IReadChunkOptions): Promise<number> {
    const normalized = this.normalizeOptions(buffer, options);
    const bytesRead = await this.peekBuffer(buffer, normalized);
    this.position = normalized.position + bytesRead;
    return bytesRead;
  }

  /** Reads bytes without changing the parser cursor; exact reads reject at EOF. */
  async peekBuffer(buffer: Uint8Array, options?: IReadChunkOptions): Promise<number> {
    if (this.closed) throw new Error('The audio file tokenizer is closed.');

    const { position, length, mayBeLess } = this.normalizeOptions(buffer, options);
    const available = Math.max(0, Math.min(length, this.fileInfo.size - position));
    if (!mayBeLess && available < length) throw new EndOfStreamError();

    // Combine bounded disk reads to fill the buffer requested by the parser.
    let bytesRead = 0;
    while (bytesRead < available) {
      const chunk = await this.reader.read(
        position + bytesRead,
        Math.min(READ_CHUNK_SIZE, available - bytesRead),
      );
      if (chunk.length === 0) break;
      buffer.set(chunk, bytesRead);
      bytesRead += chunk.length;
    }

    if (!mayBeLess && bytesRead < length) throw new EndOfStreamError();
    return bytesRead;
  }

  override close(): Promise<void> {
    this.closed = true;
    return super.close();
  }
}
