import AppButton from '@/components/ui/AppButton/AppButton';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAppTheme } from '@/hooks/use-app-theme';
import { pickBookFiles } from '@/services/book-file-picker';
import { importBook } from '@/services/book-importer';
import { readBookFilesMetadata } from '@/services/book-metadata';
import { runLibraryOperation } from '@/services/library-operation';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { groupFiles } from '@/utils/group-files';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Library } from './Library/Library';
import { styles } from './styles';

const HomeScreen = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);
  const hasBooks = useLibraryStore((state) => state.books.length > 0);
  const [isImporting, setIsImporting] = useState(false);

  return (
    <>
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
      >
        {isImporting && !hasBooks ? (
          <ActivityIndicator
            accessibilityLabel="Importing audiobooks"
            accessibilityRole="progressbar"
            color={theme.tintColor.primary}
            size="large"
          />
        ) : (
          <Library />
        )}
      </ScrollView>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label={isImporting ? 'Importing…' : 'Import'}
          icon="import"
          accessibilityLabel="Import audiobooks"
          loading={isImporting && hasBooks}
          disabled={isImporting && !hasBooks}
          onPress={() => {
            void runLibraryOperation(async () => {
              const files = await pickBookFiles('audio/mpeg');

              if (files.length === 0) return;

              setIsImporting(true);
              try {
                const filesWithMetadata = await readBookFilesMetadata(files);
                const groupedFiles = groupFiles(filesWithMetadata);
                console.log(LOG_MESSAGES.bookImport.filesSelected, files);
                console.log(LOG_MESSAGES.bookImport.metadataRead, filesWithMetadata);
                console.log(LOG_MESSAGES.bookImport.filesGrouped, groupedFiles);
                if (!userId) {
                  throw new Error(LIBRARY_ERROR_MESSAGES.invalidUserId);
                }
                await Promise.all(
                  groupedFiles.map(async (book) => {
                    try {
                      const savedBook = await importBook(userId, book);
                      if (savedBook) console.log(LOG_MESSAGES.bookImport.bookSaved, savedBook);
                    } catch (error) {
                      console.error(
                        LOG_MESSAGES.bookImport.bookSaveFailed,
                        { title: book.title },
                        error,
                      );
                    }
                  }),
                );
                await fetchBooks(userId);
              } finally {
                setIsImporting(false);
              }
            }).catch((error) => {
              console.error(LOG_MESSAGES.bookImport.preparationFailed, error);
            });
          }}
        />
      </View>
    </>
  );
};

export default HomeScreen;
