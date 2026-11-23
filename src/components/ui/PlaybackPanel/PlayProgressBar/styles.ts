import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    seek: { height: theme.spacing[5], justifyContent: 'center' },
    track: { height: theme.spacing[1], backgroundColor: theme.backgroundColor.track },
    thumb: {
      position: 'absolute',
      left: 0,
      width: theme.spacing[3],
      height: theme.spacing[3],
      borderRadius: theme.spacing[1.5],
      backgroundColor: theme.tintColor.thumb,
    },
  });
