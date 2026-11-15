import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    viewport: { flex: 1 },
    title: {
      ...theme.textStyles.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.textColor.primary,
    },
    label: { ...theme.textStyles.helperText, color: theme.textColor.primary },
    email: {
      ...theme.textStyles.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.textColor.primary,
    },
    error: { ...theme.textStyles.helperText, color: theme.textColor.error },
    container: {
      padding: theme.spacing[6],
      gap: theme.spacing[4],
      width: '100%',
      maxWidth: 800,
      alignSelf: 'center',
    },
  });
