import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      textAlign: 'center',
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
