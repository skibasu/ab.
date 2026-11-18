import AppButton from '@/components/ui/AppButton/AppButton';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAppTheme } from '@/hooks/use-app-theme';
import { pickBookFiles } from '@/services/book-file-picker';
import { importBook } from '@/services/book-importer';
import { readBookFilesMetadata } from '@/services/book-metadata';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { groupFiles } from '@/utils/group-files';
import { ScrollView, View } from 'react-native';
import { Library } from './Library/Library';
import { styles } from './styles';

const HomeScreen = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);
  return (
    <>
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
      >
        <Library />
      </ScrollView>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label="Import"
          icon="import"
          accessibilityLabel="Import audiobooks"
          onPress={async () => {
            try {
              const files = await pickBookFiles('audio/mpeg');

              if (files.length === 0) return;

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
            } catch (error) {
              console.error(LOG_MESSAGES.bookImport.preparationFailed, error);
            }
          }}
        />
      </View>
    </>
  );
};

export default HomeScreen;
