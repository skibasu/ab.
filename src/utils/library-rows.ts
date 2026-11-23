import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import type { ImportBookPreview } from '@/services/book-import.types';
import type { LibraryBook } from '@/services/book-repository';
import { bookGroupKey } from './group-files';

type ImportPreview = { userId: string; progress: number; previews: ImportBookPreview[] };
export type LibraryRow = {
  id: string;
  book: Pick<LibraryBook, 'title' | 'author' | 'coverPath' | 'duration'>;
  coverUri?: string | null;
  progress?: number;
  savedId?: string;
};

/** A preview and its committed book must keep the same list/image identity. */
export function buildLibraryRows(
  books: LibraryBook[],
  activeImport: ImportPreview | null,
): LibraryRow[] {
  const previews = activeImport?.previews ?? [];
  const rowId = (userId: string, key: string) => JSON.stringify([userId, key]);
  const counts = new Map<string, number>();
  for (const book of books) {
    const key = rowId(book.userId, bookGroupKey(book.title, book.author));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [
    ...previews
      .filter((preview) => !counts.has(rowId(activeImport!.userId, preview.key)))
      .map((preview) => ({
        id: rowId(activeImport!.userId, preview.key),
        book: {
          title: preview.title,
          author: preview.author,
          coverPath: DEFAULT_BOOK_COVER_PATH,
          duration: null,
        },
        coverUri: preview.coverUri,
        progress: activeImport!.progress,
      })),
    ...books.map((book) => {
      const key = bookGroupKey(book.title, book.author);
      const preview =
        activeImport?.userId === book.userId
          ? previews.find((item) => item.key === key)
          : undefined;
      return {
        // Older libraries may contain several records for the same metadata group.
        id:
          counts.get(rowId(book.userId, key)) === 1
            ? rowId(book.userId, key)
            : JSON.stringify([book.userId, book.id]),
        book,
        coverUri: preview?.coverUri,
        progress: preview ? activeImport!.progress : undefined,
        savedId: book.id,
      };
    }),
  ];
}
