import { useState } from 'react';
import { Alert } from 'react-native';

import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { LOG_MESSAGES } from '@/constants/log-messages';
import { useAppTheme } from '@/hooks/use-app-theme';
import { resetTestLibrary } from '@/services/reset-test-library';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';

const TITLE = 'Clear test library';

export function ResetLibraryAction() {
  const theme = useAppTheme();
  const [isResetting, setIsResetting] = useState(false);

  async function reset() {
    setIsResetting(true);
    try {
      await resetTestLibrary();
      const userId = useAuthStore.getState().user?.uid;
      if (userId) await useLibraryStore.getState().fetchBooks(userId);
    } catch (error) {
      console.error(LOG_MESSAGES.library.testResetFailed, error);
      const message =
        error instanceof Error && error.message === LIBRARY_ERROR_MESSAGES.operationInProgress
          ? LIBRARY_ERROR_MESSAGES.operationInProgress
          : LIBRARY_ERROR_MESSAGES.testResetFailed;
      Alert.alert(TITLE, message);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <ButtonHeader
      icon="close"
      iconColor={theme.textColor.error}
      label={TITLE}
      onPress={
        isResetting
          ? undefined
          : () =>
              Alert.alert(TITLE, 'Delete imported books and files for all local accounts?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear library', style: 'destructive', onPress: () => void reset() },
              ])
      }
    />
  );
}
