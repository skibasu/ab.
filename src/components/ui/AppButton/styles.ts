import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: '100%',
      minHeight: theme.minHeight.button,
      borderRadius: theme.borderRadius.button,
      padding: theme.spacing[4],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2.5],
    },
    primary: {
      backgroundColor: theme.backgroundColor.primary,
    },
    primaryPressed: {
      backgroundColor: theme.backgroundColor.primaryPressed,
    },
    ghost: {
      backgroundColor: theme.backgroundColor.control,
    },
    ghostPressed: {
      backgroundColor: theme.backgroundColor.controlPressed,
    },
    disabled: {
      backgroundColor: theme.backgroundColor.disabled,
    },
    label: {
      ...theme.textStyles.button,

      flexShrink: 1,
      textAlign: 'center',
    },
    primaryLabel: {
      color: theme.textColor.onPrimary,
    },
    ghostLabel: {
      color: theme.textColor.primary,
    },
    disabledLabel: {
      color: theme.textColor.disabled,
    },
    spinner: {
      width: theme.width.icon,
      height: theme.height.icon,
      flexShrink: 0,
    },
  });
