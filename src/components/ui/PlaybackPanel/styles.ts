import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    panel: {
      backgroundColor: theme.backgroundColor.card,
      borderRadius: theme.borderRadius.card,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
      gap: theme.spacing[1],
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      minHeight: 76,
    },
    options: { flexDirection: 'row', justifyContent: 'space-between' },
  });
