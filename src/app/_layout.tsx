import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = false; // Replace with your authentication logic

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
