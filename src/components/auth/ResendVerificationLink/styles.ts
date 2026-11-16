import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    rootContainer: {
      width: '100%',
      paddingVertical: theme.spacing[4],
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 1,
      gap: theme.spacing[4],
    },
    linkContainer: {
      width: '100%',
      minHeight: theme.height.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      ...theme.textStyles.link,
      color: theme.textColor.link,
      textDecorationLine: 'none',
      textAlign: 'center',
    },
    textError: {
      ...theme.textStyles.link,
      color: theme.textColor.error,
      textDecorationLine: 'none',
      textAlign: 'center',
    },
    textSuccess: {
      ...theme.textStyles.link,
      color: theme.textColor.success,
      textDecorationLine: 'none',
      textAlign: 'center',
    },
    pressed: {
      color: theme.textColor.linkPressed,
    },
    disabled: {
      color: theme.textColor.linkDisabled,
    },
  });
