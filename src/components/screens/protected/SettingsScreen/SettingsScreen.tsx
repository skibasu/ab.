import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import AppButton from '@/components/ui/AppButton/AppButton';
import { useAppTheme } from '@/hooks/use-app-theme';
import { logout } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { useAuthStore } from '@/stores/auth-store';
import { styles } from './styles';

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useAppTheme();
  const localStyles = styles(theme);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setError(null);
    try {
      await logout();
      // The Firebase listener clears the store and the protected navigator opens Login.
    } catch (error) {
      setError(getAuthErrorMessage(error, 'logout'));
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={localStyles.viewport}
    >
      <ScrollView contentContainerStyle={localStyles.container}>
        <ThemedText accessibilityRole="header">Account</ThemedText>
        <ThemedText type="small">Email</ThemedText>
        <ThemedText selectable>{user?.email ?? 'No email address'}</ThemedText>
        {error && (
          <ThemedText
            type="small"
            themeColor="error"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </ThemedText>
        )}
        <AppButton
          label="Logout"
          loading={isSigningOut}
          loadingLabel="Logging out…"
          onPress={() => void handleLogout()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
