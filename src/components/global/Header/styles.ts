import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { backgroundColor: theme.backgroundColor.default },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 11,
      paddingHorizontal: theme.spacing[4],
    },

    actions: {
      flexDirection: 'row',
      gap: theme.spacing[2],
    },
  });
