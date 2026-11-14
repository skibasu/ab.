import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      width: '100%',
      backgroundColor: theme.backgroundColor.card,
      borderRadius: theme.borderRadius.control,
      overflow: 'hidden',
    },
    container: {
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: theme.spacing[4] - 1,
      paddingVertical: theme.spacing[3] - 1,
      height: 48,
    },
    wrapper: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2.5] },
    image: { width: 14, height: 14, tintColor: theme.tintColor.primary },
    title: { ...theme.textStyles.sectionHeading, color: theme.textColor.primary },
    arrow: { width: 9, height: 5, tintColor: theme.tintColor.primary },
    pressed: { opacity: 0.75 },
    content: {
      width: '100%',
    },
  });
