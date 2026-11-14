import { useAppTheme } from '@/hooks/use-app-theme';
import { ROOT_STACK_OPTIONS } from '@/constants/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { fontFamilies } from '@/theme/fonts';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

void SplashScreen.preventAutoHideAsync().catch(console.error);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  const theme = useAppTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hide();
    if (fontError) throw fontError;
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded) return null;

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
            guard={isAuthenticated}
            redirectTo="/login"
          >
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
