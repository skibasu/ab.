import { withLibraryDatabase } from './library-database';
import { runLibraryOperation } from './library-operation';
import { getLibraryRoot } from './library-storage';

/** Clears imported media and database records for every local account. */
export async function resetTestLibrary(): Promise<void> {
  if (!__DEV__) return;

  await runLibraryOperation(() =>
    withLibraryDatabase((database) =>
      database.withTransactionAsync(async () => {
        await database.runAsync('DELETE FROM books');

        const library = getLibraryRoot();
        if (library.exists) library.delete();
      }),
    ),
  );
}
