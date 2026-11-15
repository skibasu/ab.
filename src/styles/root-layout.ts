import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[6],
      backgroundColor: theme.backgroundColor.default,
    },
    errorMessage: {
      ...theme.textStyles.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.textColor.primary,
      textAlign: 'center',
    },
  });
