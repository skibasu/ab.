export type AudioFile = {
  uri: string;
  album?: string;
  albumArtist?: string;
  artist?: string;
};

export function groupFiles<T extends AudioFile>(files: T[]) {
  const groups = new Map<string, { title: string; author: string; files: T[] }>();

  for (const file of files) {
    const title = file.album || 'Unknown';
    const author = file.albumArtist || file.artist || 'Unknown';

    const key = file.album
      ? JSON.stringify(['book', title, author])
      : JSON.stringify(['file', file.uri]);

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
