import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    optionTarget: { minHeight: theme.height.touchTarget, justifyContent: 'center' },
    option: {
      minHeight: 36,
      minWidth: 70,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[1.5],
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1.5],
      borderWidth: 1,
      borderColor: theme.borderColor.default,
      borderRadius: 18,
      backgroundColor: theme.backgroundColor.control,
    },
    optionLabel: { ...theme.textStyles.bookTile, color: theme.textColor.primary },
  });
