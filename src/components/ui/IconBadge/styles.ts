import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: 112,
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.control,
      overflow: 'hidden',
    },
    background: {
      ...StyleSheet.absoluteFill,
      borderRadius: 56,
      backgroundColor: theme.backgroundColor.primary,
      opacity: 0.16,
    },
  });
