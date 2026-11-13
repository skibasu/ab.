import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    subtitle: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
    },
  });
