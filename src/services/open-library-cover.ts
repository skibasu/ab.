import { fetch } from 'expo/fetch';
import { stripPolishDiacritics } from '@/utils/strip-polish-diacritics';

const SEARCH_INTERVAL_MS = 1_000;
const LOOKUP_TIMEOUT_MS = 5_000;

type SearchResult = {
  title?: string;
  author_name?: string[];
  cover_i?: number;
};

let pendingSearch = Promise.resolve();
let nextSearchAt = 0;

/** Finds one matching cover and downloads its JPEG bytes. */
export async function findOpenLibraryCover(
  title: string,
  author: string,
): Promise<Uint8Array | null> {
  const normalizedTitle = normalizeName(title);
  const normalizedAuthor = normalizeName(author);
  if (!normalizedTitle || !normalizedAuthor) return null;
  if (normalizedTitle === 'unknown' || normalizedAuthor === 'unknown') return null;

  const search = pendingSearch.then(async () => {
    const delay = nextSearchAt - Date.now();
    if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    nextSearchAt = Date.now() + SEARCH_INTERVAL_MS;

    const params = new URLSearchParams({
      title: stripPolishDiacritics(title).trim(),
      author: stripPolishDiacritics(author).trim(),
      fields: 'title,author_name,cover_i',
      limit: '5',
    });
    return request(`https://openlibrary.org/search.json?${params}`, async (response) => {
      const data: { docs?: SearchResult[] } = await response.json();
      return data.docs?.find(
        (book) =>
          typeof book.cover_i === 'number' &&
          Number.isSafeInteger(book.cover_i) &&
          book.cover_i > 0 &&
          normalizeName(book.title ?? '') === normalizedTitle &&
          book.author_name?.some((name) => normalizeName(name) === normalizedAuthor),
      )?.cover_i;
    });
  });
  pendingSearch = search.then(
    () => undefined,
    () => undefined,
  );

  const coverId = await search;
  if (!coverId) return null;

  return request(
    `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`,
    async (response) => {
      const bytes = await response.bytes();
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      return isJpeg ? bytes : null;
    },
  );
}

function normalizeName(value: string): string {
  return stripPolishDiacritics(value.normalize('NFKC'))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

async function request<T>(
  url: string,
  read: (response: Awaited<ReturnType<typeof fetch>>) => Promise<T>,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok ? await read(response) : null;
  } finally {
    clearTimeout(timer);
  }
}
