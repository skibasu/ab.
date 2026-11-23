import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    skipButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    skipLabel: {
      ...theme.textStyles.time,
      color: theme.textColor.primary,
      position: 'absolute',
      top: 19,
      width: '100%',
      textAlign: 'center',
    },
  });
