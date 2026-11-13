import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      minWidth: theme.width.touchTarget,
      minHeight: theme.height.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 1,
    },
    text: {
      ...theme.textStyles.link,
      color: theme.textColor.link,
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
