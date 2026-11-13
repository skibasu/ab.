import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: theme.spacing[2],
    },
  });
