import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: '100%',
      minHeight: 56,
      borderRadius: theme.borderRadius.control,
      backgroundColor: theme.backgroundColor.card,
      padding: theme.spacing[4],
      gap: theme.spacing[3],
      flexDirection: 'row',
      alignItems: 'center',
    },
    label: {
      ...theme.textStyles.sectionHeading,
      flex: 1,
      textAlign: 'left',
    },
    pressed: { opacity: 0.75 },
  });
