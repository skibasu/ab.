import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    option: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      gap: theme.spacing[1],
      minHeight: theme.height.touchTarget,
      padding: theme.spacing[1],
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.backgroundColor.control,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedOption: {
      backgroundColor: theme.backgroundColor.primary,
    },
    label: {
      ...theme.textStyles.metadata,
      flexShrink: 1,
      color: theme.textColor.primary,
      textAlign: 'center',
    },
    selectedLabel: {
      color: theme.textColor.onPrimary,
    },
  });
