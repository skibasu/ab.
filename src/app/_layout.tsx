import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { STARTUP_ERROR_MESSAGE, TECHNICAL_ERROR_MESSAGES } from '@/constants/errors';
import { ROOT_STACK_OPTIONS } from '@/constants/navigation';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getFirebaseAuth } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { fontFamilies } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.error(TECHNICAL_ERROR_MESSAGES.preventSplashAutoHideFailed, error);
});

function hideSplashScreen() {
  void SplashScreen.hideAsync().catch((error: unknown) => {
    console.error(TECHNICAL_ERROR_MESSAGES.hideSplashFailed, error);
  });
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  const theme = useAppTheme();

  useEffect(() => {
    hideSplashScreen();
    console.error(TECHNICAL_ERROR_MESSAGES.rootLayoutFailed, error);
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[6],
        backgroundColor: theme.backgroundColor.default,
      }}
    >
      <ThemedText
        accessibilityRole="alert"
        style={{ textAlign: 'center' }}
      >
        {STARTUP_ERROR_MESSAGE}
      </ThemedText>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  const [authStartupError, setAuthStartupError] = useState<Error>();
  const theme = useAppTheme();
  const isAuthenticated = useAuthStore((state) => state.user?.emailVerified === true);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const setUser = useAuthStore((state) => state.setUser);
  const isReady = fontsLoaded && isAuthReady;

  useEffect(() => {
    const handleAuthStartupError = (cause: unknown) => {
      setAuthStartupError(
        new Error(TECHNICAL_ERROR_MESSAGES.firebaseAuthInitializationFailed, { cause }),
      );
    };

    try {
      return onAuthStateChanged(getFirebaseAuth(), setUser, handleAuthStartupError);
    } catch (error) {
      handleAuthStartupError(error);
    }
  }, [setUser]);

  useEffect(() => {
    if (isReady) hideSplashScreen();
  }, [isReady]);

  if (authStartupError) throw authStartupError;
  if (fontError) throw new Error(TECHNICAL_ERROR_MESSAGES.fontLoadingFailed, { cause: fontError });
  if (!isReady) return null;

  const navigationBase = theme.dark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...navigationBase,
    colors: {
      ...navigationBase.colors,
      primary: theme.backgroundColor.primary,
      background: theme.backgroundColor.default,
      card: theme.backgroundColor.default,
      text: theme.textColor.primary,
      border: theme.borderColor.default,
      notification: theme.backgroundColor.accent,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        <Stack screenOptions={ROOT_STACK_OPTIONS}>
          <Stack.Protected
            guard={!isAuthenticated}
            redirectTo="/"
          >
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected
            guard={isAuthenticated === true}
            redirectTo="/login"
          >
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
