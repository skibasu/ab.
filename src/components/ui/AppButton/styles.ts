import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: '100%',
      maxWidth: theme.maxWidth.content,
      minHeight: theme.minHeight.button,
      borderRadius: theme.borderRadius.button,
      padding: theme.spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2.5],
    },
    label: {
      ...theme.textStyles.button,
      maxWidth: theme.maxWidth.buttonLabel,
      flexShrink: 1,
      textAlign: 'center',
    },
    spinner: {
      width: theme.width.icon,
      height: theme.height.icon,
      flexShrink: 0,
    },
  });
