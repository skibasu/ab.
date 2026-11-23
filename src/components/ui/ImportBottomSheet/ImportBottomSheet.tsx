import { router, useLocalSearchParams } from 'expo-router';
import { getImportErrorParams } from '@/utils/import-error-content';
import { randomUUID } from 'expo-crypto';
import { useBookImportStore } from '@/stores/book-import-store';
import AppButton from '@/components/ui/AppButton/AppButton';
import ButtonSelector from '@/components/ui/ButtonSelector/ButtonSelector';
import { APP_ERROR_CODES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAppTheme } from '@/hooks/use-app-theme';
import { pickBookFiles } from '@/services/book-file-picker';
import { BookImportError } from '@/services/book-import-error';
import { reportBookImportFailure } from '@/services/report-book-import-failure';
import { importSelectedBooks } from '@/services/import-selected-books';
import { runLibraryOperation } from '@/services/library-operation';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { BottomSheet, BottomSheetView } from '@expo/ui/community/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const retryParams = useLocalSearchParams<{
    retryImport?: string | string[];
    importType?: string | string[];
  }>();
  const consumedRetry = useRef<string | undefined>(undefined);
  const handlePress = useCallback(
    (type: 'audio/mpeg' | 'application/zip') => {
      let savedBooks = 0;
      void runLibraryOperation(async () => {
        const controller = new AbortController();
        const importId = randomUUID();
        let cleanupPreviewFiles: (() => void) | undefined;
        let reportedError: BookImportError | undefined;
        importController.current = controller;
        setIsImporting(true);
        sheetRef.current?.close();
        try {
          const files = await pickBookFiles(type);
          if (files.length === 0) return;
          useBookImportStore.getState().startImport(importId, userId ?? '', files[0].name);
          try {
            const result = await importSelectedBooks(userId ?? '', files, type, {
              signal: controller.signal,
              onStageChange: (stage) => setIsSaving(stage === 'saving'),
              onUpdate: (update) => useBookImportStore.getState().updateImport(importId, update),
              onIssue: (code) => {
                reportedError ??= new BookImportError(code);
              },
              deferPreviewCleanup: (cleanup) => {
                cleanupPreviewFiles = cleanup;
              },
            });
            savedBooks = result.savedBooks;
            if (result.failedBooks || reportedError)
              throw reportedError ?? new BookImportError(APP_ERROR_CODES.importFileSaveFailed);
          } finally {
            if (userId && useAuthStore.getState().user?.uid === userId) await fetchBooks(userId);
          }
          if (!userId || useAuthStore.getState().user?.uid !== userId) return;
          return userId;
        } finally {
          useBookImportStore.getState().clearImport(importId);
          let cleanupError: BookImportError | undefined;
          try {
            cleanupPreviewFiles?.();
          } catch (error) {
            console.warn(LOG_MESSAGES.bookImport.workspaceCleanupFailed, error);
            cleanupError = new BookImportError(APP_ERROR_CODES.importCleanupFailed, error);
          }
          importController.current = null;
          setIsImporting(false);
          setIsSaving(false);
          if (cleanupError) throw cleanupError;
        }
      })
        .then((importedForUserId) => {
          if (importedForUserId) useLibraryStore.getState().fetchMissingCovers(importedForUserId);
        })
        .catch((error) => {
          if (!reportBookImportFailure(error, type)) return;
          if (userId && useAuthStore.getState().user?.uid === userId) {
            router.push({
              pathname: '/import-error',
              params: getImportErrorParams(error, type, savedBooks),
            });
          }
        });
    },
    [fetchBooks, userId],
  );

  const retryId = Array.isArray(retryParams.retryImport)
    ? retryParams.retryImport[0]
    : retryParams.retryImport;
  const retryType = Array.isArray(retryParams.importType)
    ? retryParams.importType[0]
    : retryParams.importType;
  useEffect(() => {
    if (!retryId || consumedRetry.current === retryId) return;
    consumedRetry.current = retryId;
    router.setParams({ retryImport: undefined, importType: undefined });
    handlePress(retryType === 'application/zip' ? 'application/zip' : 'audio/mpeg');
  }, [retryId, retryType, handlePress]);
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
