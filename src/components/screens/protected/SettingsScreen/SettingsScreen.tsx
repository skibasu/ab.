import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <Text
          style={localStyles.title}
          accessibilityRole="header"
        >
          Account
        </Text>
        <Text style={localStyles.label}>Email</Text>
        <Text
          style={localStyles.email}
          selectable
        >
          {user?.email ?? 'No email address'}
        </Text>
        {error && (
          <Text
            style={localStyles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
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
