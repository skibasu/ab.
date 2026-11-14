import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: theme.spacing[1.5],
    },
    icon: {
      width: 14,
      height: 14,
    },
  });
