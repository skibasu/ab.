import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing[4],
      width: '100%',
    },
    error: { ...theme.textStyles.helperText, color: theme.textColor.error },
    linkContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
