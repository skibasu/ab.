import { useColorScheme, View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const backgroundColor =
    (colorScheme === 'dark' ? darkColor : lightColor) ?? theme[type ?? 'background'];

  return (
    <View
      style={[{ backgroundColor }, style]}
      {...otherProps}
    />
  );
}
