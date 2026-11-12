import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      ...theme.textStyles.bookTile,
      color: theme.textColor.primary,
      marginBottom: theme.spacing[2],
    },
    errorSlot: {
      marginTop: theme.spacing[1],
    },
    error: {
      ...theme.textStyles.metadata,
      color: theme.textColor.error,
      lineHeight: theme.lineHeight[6],
      includeFontPadding: false,
    },
  });
