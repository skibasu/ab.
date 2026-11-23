import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundColor.card,
    },
    ring: { position: 'absolute' },
    label: {
      ...theme.textStyles.caption,
      color: theme.textColor.primary,
      fontVariant: ['tabular-nums'],
    },
  });
