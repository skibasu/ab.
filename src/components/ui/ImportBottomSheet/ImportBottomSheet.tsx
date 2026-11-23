import AppButton from '@/components/ui/AppButton/AppButton';
import ButtonSelector from '@/components/ui/ButtonSelector/ButtonSelector';
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
import { BottomSheet, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

const ImportBottomSheet = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);
  const hasBooks = useLibraryStore((state) => state.books.length > 0);
  const [isImporting, setIsImporting] = useState(false);

  const sheetRef = useRef<BottomSheet>(null);
  const handlePress = (type: 'audio/mpeg' | 'application/zip') => {
    void runLibraryOperation(async () => {
      const files = await pickBookFiles(type);

      if (files.length === 0) return;

      setIsImporting(true);
      try {
        const filesWithMetadata = await readBookFilesMetadata(files);
        const groupedFiles = groupFiles(filesWithMetadata);

        if (!userId) {
          throw new Error(LIBRARY_ERROR_MESSAGES.invalidUserId);
        }
        await Promise.allSettled(groupedFiles.map((book) => importBook(userId, book)));
        await fetchBooks(userId);
        return userId;
      } finally {
        setIsImporting(false);
      }
    })
      .then((importedForUserId) => {
        if (importedForUserId) useLibraryStore.getState().fetchMissingCovers(importedForUserId);
      })
      .catch((error) => {
        console.error(LOG_MESSAGES.bookImport.preparationFailed, error);
      });
  };
  return (
    <View style={{ width: '100%' }}>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label={isImporting ? 'Importing…' : 'Import'}
          icon="import"
          accessibilityLabel="Import audiobooks"
          loading={isImporting && hasBooks}
          disabled={isImporting && !hasBooks}
          onPress={() => sheetRef.current?.present()}
        />
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        enablePanDownToClose
      >
        <BottomSheetView style={{ padding: 24 }}>
          <View style={localStyles.contentContainer}>
            <View style={localStyles.header}>
              <Text style={localStyles.title}>Import books</Text>
              <Text style={localStyles.subtitle}>Choose a file format to continue.</Text>
            </View>
            <View style={localStyles.selectorsContainer}>
              <ButtonSelector
                label="MP3 files"
                icon="mp3File"
                hasArrow
                onPress={() => handlePress('audio/mpeg')}
              />
              <ButtonSelector
                label="ZIP archive"
                icon="zipArchive"
                hasArrow
                onPress={() => handlePress('application/zip')}
              />
              <AppButton
                label="Cancel"
                variant="ghost"
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};
export default ImportBottomSheet;
