import { stripPolishDiacritics } from './strip-polish-diacritics';

export type AudioFile = {
  uri: string;
  album?: string;
  albumArtist?: string;
  artist?: string;
};

export function bookGroupKey(title: string, author: string): string {
  const normalize = (value: string) =>
    stripPolishDiacritics(value.normalize('NFKC')).trim().replace(/\s+/g, ' ').toLowerCase();
  return JSON.stringify([normalize(title), normalize(author)]);
}

export function groupFiles<T extends AudioFile>(files: T[]) {
  const unknown = 'Unknown';
  const groups = new Map<string, { title: string; author: string; files: T[] }>();

  for (const file of files) {
    const album = file.album?.trim();
    const title = album && album.toLowerCase() !== unknown.toLowerCase() ? album : unknown;
    const author =
      title === unknown ? unknown : file.albumArtist?.trim() || file.artist?.trim() || unknown;

    const key = bookGroupKey(title, author);

    const existingBook = groups.get(key);

    if (existingBook) {
      existingBook.files.push(file);
    } else {
      groups.set(key, {
        title,
        author,
        files: [file],
      });
    }
  }

  return Array.from(groups.values());
}
