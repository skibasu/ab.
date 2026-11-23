import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    buttonContainer: {
      width: '100%',
      paddingHorizontal: theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
  });
