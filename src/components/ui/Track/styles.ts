import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: theme.height.touchTarget,
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      gap: theme.spacing[2],
      borderRadius: theme.borderRadius.control,
    },
    selected: { backgroundColor: theme.backgroundColor.control },
    pressed: { backgroundColor: theme.backgroundColor.controlPressed },
    number: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      minWidth: 27,
      fontVariant: ['tabular-nums'],
    },
    selectedNumber: { color: theme.textColor.link },
    title: {
      ...theme.textStyles.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.textColor.primary,
      flex: 1,
      minWidth: 0,
    },
    selectedTitle: { fontWeight: theme.fontWeight.semibold },
    duration: {
      ...theme.textStyles.time,
      color: theme.textColor.secondary,
      fontVariant: ['tabular-nums'],
      flexShrink: 0,
    },
  });
