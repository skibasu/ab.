import AppButton from '@/components/ui/AppButton/AppButton';
import ButtonSelector from '@/components/ui/ButtonSelector/ButtonSelector';
import { APP_ERROR_CODES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAppTheme } from '@/hooks/use-app-theme';
import { pickBookFiles } from '@/services/book-file-picker';
import { BookImportError } from '@/services/book-import-error';
import { importSelectedBooks } from '@/services/import-selected-books';
import { runLibraryOperation } from '@/services/library-operation';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { BottomSheet, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

const ImportBottomSheet = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const userId = useAuthStore((state) => state.user?.uid);
  const fetchBooks = useLibraryStore((state) => state.fetchBooks);
  const hasBooks = useLibraryStore((state) => state.books.length > 0);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const importController = useRef<AbortController | null>(null);

  useEffect(() => () => importController.current?.abort(), []);

  const sheetRef = useRef<BottomSheet>(null);
  const handlePress = (type: 'audio/mpeg' | 'application/zip') => {
    void runLibraryOperation(async () => {
      const controller = new AbortController();
      importController.current = controller;
      setIsImporting(true);
      sheetRef.current?.close();
      try {
        const files = await pickBookFiles(type);
        if (files.length === 0) return;
        try {
          await importSelectedBooks(userId ?? '', files, type, {
            signal: controller.signal,
            onStageChange: (stage) => setIsSaving(stage === 'saving'),
          });
        } finally {
          if (userId && useAuthStore.getState().user?.uid === userId) await fetchBooks(userId);
        }
        if (!userId || useAuthStore.getState().user?.uid !== userId) return;
        return userId;
      } finally {
        importController.current = null;
        setIsImporting(false);
        setIsSaving(false);
      }
    })
      .then((importedForUserId) => {
        if (importedForUserId) useLibraryStore.getState().fetchMissingCovers(importedForUserId);
      })
      .catch((error) => {
        if (error instanceof BookImportError && error.code === APP_ERROR_CODES.importCancelled)
          return;
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
                disabled={isImporting}
                onPress={() => handlePress('audio/mpeg')}
              />
              <ButtonSelector
                label="ZIP archive"
                icon="zipArchive"
                hasArrow
                disabled={isImporting}
                onPress={() => handlePress('application/zip')}
              />
              <AppButton
                label="Cancel"
                variant="ghost"
                disabled={isSaving}
                onPress={() => {
                  if (isImporting) importController.current?.abort();
                  else sheetRef.current?.dismiss();
                }}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};
export default ImportBottomSheet;
