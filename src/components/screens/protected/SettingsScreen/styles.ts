import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    viewport: { flex: 1 },
    container: {
      padding: theme.spacing[6],
      gap: theme.spacing[4],
      width: '100%',
      maxWidth: 800,
      alignSelf: 'center',
    },
  });
