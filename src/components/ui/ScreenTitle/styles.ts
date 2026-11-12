import { AppTheme, textStyles } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      ...textStyles.screenTitle,
      color: theme.textColor.primary,
    },
  });
