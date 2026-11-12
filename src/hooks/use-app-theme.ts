import { useColorScheme } from 'react-native';

import { getTheme, type ThemePreference } from '@/theme';

/** Full native design system; subscribes to system appearance changes. */
export function useAppTheme(preference: ThemePreference = 'system') {
  const systemScheme = useColorScheme();

  return getTheme(preference === 'system' ? systemScheme : preference);
}
