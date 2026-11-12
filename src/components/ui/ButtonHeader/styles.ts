import { AppTheme } from '@/theme/theme';

import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    touchTarget: {
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.textColor.primary,
    },
    body: {
      backgroundColor: theme.backgroundColor.control,
      width: theme.width.touchTarget,
      height: theme.height.touchTarget,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: { width: theme.width.icon, height: theme.height.icon },
  });
