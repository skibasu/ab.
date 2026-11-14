import { useAppTheme } from '@/hooks/use-app-theme';
import { ROOT_STACK_OPTIONS } from '@/constants/navigation';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { fontFamilies } from '@/theme/fonts';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

void SplashScreen.preventAutoHideAsync().catch(console.error);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  const theme = useAppTheme();
  const isAuthenticated = useAuthStore((state) => state.user?.emailVerified === true);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const setUser = useAuthStore((state) => state.setUser);
  const isReady = fontsLoaded && isAuthReady;

  useEffect(() => onAuthStateChanged(auth, setUser), [setUser]);

  useEffect(() => {
    if (isReady || fontError) SplashScreen.hide();
    if (fontError) throw fontError;
  }, [isReady, fontError]);

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
