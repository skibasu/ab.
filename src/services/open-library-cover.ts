import { fetch } from 'expo/fetch';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { stripPolishDiacritics } from '@/utils/strip-polish-diacritics';

const SEARCH_INTERVAL_MS = 1_000;
const LOOKUP_TIMEOUT_MS = 5_000;

type CoverResult = {
  title?: string;
  cover_i?: number;
};

type SearchResult = CoverResult & {
  author_name?: string[];
  editions?: { docs?: CoverResult[] };
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
  if (
    !normalizedTitle ||
    !normalizedAuthor ||
    normalizedTitle === 'unknown' ||
    normalizedAuthor === 'unknown'
  ) {
    console.info(LOG_MESSAGES.bookImport.remoteCoverMissingMetadata, { title, author });
    return null;
  }

  const query = {
    title: stripPolishDiacritics(title).trim(),
    author: stripPolishDiacritics(author).trim(),
  };

  const search = pendingSearch.then(async () => {
    const delay = nextSearchAt - Date.now();
    if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    nextSearchAt = Date.now() + SEARCH_INTERVAL_MS;

    const params = new URLSearchParams({
      q: query.title,
      lang: 'pl',
      fields: 'key,title,author_name,cover_i,editions,editions.key,editions.title,editions.cover_i,editions.language',
      limit: '10',
    });
    console.info(LOG_MESSAGES.bookImport.remoteCoverLookup, query);
    return request(`https://openlibrary.org/search.json?${params}`, async (response) => {
      const data: { docs?: SearchResult[] } = await response.json();
      let workCoverId: number | undefined;
      for (const work of data.docs ?? []) {
        if (!work.author_name?.some((name) => normalizeName(name) === normalizedAuthor)) continue;

        const edition = work.editions?.docs?.find((item) => matchesCover(item, normalizedTitle));
        if (edition) return edition.cover_i;
        if (matchesCover(work, normalizedTitle)) workCoverId ??= work.cover_i;
      }
      return workCoverId;
    });
  });
  pendingSearch = search.then(
    () => undefined,
    () => undefined,
  );

  const coverId = await search;
  if (!coverId) {
    console.info(LOG_MESSAGES.bookImport.remoteCoverNotFound, query);
    return null;
  }

  const cover = await request(
    `https://covers.openlibrary.org/b/id/${coverId}-M.jpg?default=false`,
    async (response) => {
      const bytes = await response.bytes();
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      return isJpeg ? bytes : null;
    },
  );
  if (!cover) console.info(LOG_MESSAGES.bookImport.remoteCoverNotFound, query);
  return cover;
}

function normalizeName(value: string): string {
  return stripPolishDiacritics(value.normalize('NFKC'))
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function matchesCover(book: CoverResult, normalizedTitle: string): boolean {
  return (
    normalizeName(book.title ?? '') === normalizedTitle &&
    typeof book.cover_i === 'number' &&
    Number.isSafeInteger(book.cover_i) &&
    book.cover_i > 0
  );
}

async function request<T>(
  url: string,
  read: (response: Awaited<ReturnType<typeof fetch>>) => Promise<T>,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(LIBRARY_ERROR_MESSAGES.remoteCoverRequestFailed(response.status));
    return await read(response);
  } finally {
    clearTimeout(timer);
  }
}
