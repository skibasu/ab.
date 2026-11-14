import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    option: {
      width: 101,
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
      color: theme.textColor.primary,
      textAlign: 'center',
    },
    selectedLabel: {
      color: theme.textColor.onPrimary,
    },
  });
