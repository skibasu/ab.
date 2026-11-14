import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: theme.spacing[4] - theme.borderWidth.input,
      paddingTop: theme.spacing[3],
      paddingBottom: theme.spacing[4] - theme.borderWidth.input,
    },
    title: {
      ...theme.textStyles.bookTile,
      color: theme.textColor.primary,
      marginBottom: theme.spacing[2],
    },
    filters: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: theme.spacing[1.5],
    },
    description: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      marginTop: theme.spacing[4],
    },
  });
