import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    heading: { paddingVertical: theme.spacing[3], flexDirection: 'row', gap: theme.spacing[2] },
    number: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      minWidth: 27,
      fontVariant: ['tabular-nums'],
    },
    title: {
      ...theme.textStyles.bookTile,
      fontWeight: theme.fontWeight.regular,
      color: theme.textColor.primary,
    },
  });
