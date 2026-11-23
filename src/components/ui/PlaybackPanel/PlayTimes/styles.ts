import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    times: { flexDirection: 'row', justifyContent: 'space-between' },
    time: {
      ...theme.textStyles.time,
      color: theme.textColor.secondary,
      fontVariant: ['tabular-nums'],
    },
  });
