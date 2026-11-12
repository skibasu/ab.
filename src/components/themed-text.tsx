import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import type { TextColorName } from '@/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: TextColorName;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useAppTheme();

  return (
    <Text
      style={[{ color: theme.textColor[themeColor ?? 'primary'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 48,
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontFamily: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
