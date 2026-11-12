import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function RootLayout() {
  const theme = useAppTheme();
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
  const isAuthenticated = true; // Replace with your authentication logic

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
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
    </ThemeProvider>
  );
}
