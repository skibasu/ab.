import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      minHeight: 130,
      padding: theme.spacing[3],
      gap: theme.spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...theme.textStyles.sectionHeading,
      textAlign: 'center',
      includeFontPadding: false,
    },
    message: {
      textAlign: 'center',
      includeFontPadding: false,
    },
  });
