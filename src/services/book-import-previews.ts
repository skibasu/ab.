import { randomUUID } from 'expo-crypto';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { Directory, File } from 'expo-file-system';
import type { IPicture } from 'music-metadata';

import { LOG_MESSAGES } from '@/constants/log-messages';
import { bookGroupKey, groupFiles } from '@/utils/group-files';
import type { BookImportUpdate, ImportBookPreview } from './book-import.types';
import { readBookFilesMetadata, type BookFileWithMetadata } from './book-metadata';
import type { BookToSave } from './library-storage';
import { findOpenLibraryCover } from './open-library-cover';
import { getImportWorkspaceRoot } from './zip-import';

/** Previews are temporary; the library receives records only after audio has been saved. */
export function createBookImportPreviews(
  publish: ((update: BookImportUpdate) => void) | undefined,
  assertActive: () => void,
  signal: AbortSignal,
) {
  const metadata = new Map<string, BookFileWithMetadata | undefined>();
  const covers = new Map<string, IPicture | null>();
  const embeddedCovers = new Map<string, IPicture>();
  const displayedCovers = new Map<string, IPicture>();
  const previews = new Map<string, ImportBookPreview>();
  let workspace: Directory | undefined;
  const emit = () => {
    assertActive();
    publish?.({ previews: [...previews.values()] });
  };

  const read = async (file: DocumentPickerAsset) => {
    assertActive();
    if (metadata.has(file.uri)) return metadata.get(file.uri);
    const [result] = await readBookFilesMetadata([file], signal);
    assertActive();
    metadata.set(file.uri, result);
    return result;
  };

  const prepareCover = async (book: BookToSave): Promise<IPicture | null> => {
    assertActive();
    const key = bookGroupKey(book.title, book.author);
    if (!previews.has(key)) {
      previews.set(key, { key, title: book.title, author: book.author, coverUri: null });
      emit();
    }
    const embedded = book.files.find((file) => file.cover)?.cover;
    // MP3 tag parsers create a new picture object for each part. Pick the first embedded
    // cover once per book instead of rewriting the preview for every object/part.
    if (embedded && !embeddedCovers.has(key)) embeddedCovers.set(key, embedded);
    let cover = embeddedCovers.get(key) ?? covers.get(key) ?? null;
    if (!cover && !covers.has(key)) {
      publish?.({ stage: 'cover' });
      try {
        const data = await findOpenLibraryCover(book.title, book.author, signal);
        if (data) cover = { data, format: 'image/jpeg' };
      } catch (error) {
        assertActive();
        console.warn(
          LOG_MESSAGES.bookImport.remoteCoverSkipped,
          { title: book.title, author: book.author },
          error,
        );
      }
    }
    assertActive();
    covers.set(key, cover);
    if (cover && displayedCovers.get(key) !== cover) {
      try {
        if (!workspace) {
          const root = getImportWorkspaceRoot();
          root.create({ intermediates: true, idempotent: true });
          workspace = new Directory(root, randomUUID());
          workspace.create();
        }
        const extension =
          cover.format === 'image/jpeg' ? 'jpg' : cover.format === 'image/png' ? 'png' : 'image';
        const file = new File(workspace, `${randomUUID()}.${extension}`);
        await file.write(cover.data);
        assertActive();
        previews.set(key, { ...previews.get(key)!, coverUri: file.uri });
        displayedCovers.set(key, cover);
        emit();
      } catch (error) {
        assertActive();
        console.warn(LOG_MESSAGES.bookImport.coverSkipped, { title: book.title }, error);
      }
    }
    return cover;
  };

  return {
    read,
    prepareCover,
    async prepare(file: DocumentPickerAsset) {
      const record = await read(file);
      if (record) await prepareCover(groupFiles([record])[0]);
    },
    cleanup() {
      if (workspace?.exists) workspace.delete();
    },
  };
}
