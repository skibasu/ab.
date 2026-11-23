import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      padding: theme.spacing[6],
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: theme.spacing[6],
      paddingBottom: theme.spacing[8],
    },
    contentContainer: {
      gap: theme.spacing[5],
    },
    header: { width: '100%', gap: theme.spacing[2] },
    selectorsContainer: { width: '100%', gap: theme.spacing[4] },
    title: { ...theme.textStyles.playerTitle, color: theme.textColor.primary },
    subtitle: { ...theme.textStyles.metadata, color: theme.textColor.primary },
  });
