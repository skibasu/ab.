import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing[2],
      alignItems: 'center',
    },
  });
