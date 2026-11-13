import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      ...theme.textStyles.pageTitle,
      color: theme.textColor.primary,
    },
  });
