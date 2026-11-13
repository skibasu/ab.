import type { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      ...theme.textStyles.headerTitle,
      color: theme.textColor.primary,
    },
  });
