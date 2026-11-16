import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      textAlign: 'center',
      flexShrink: 1,
    },
  });
