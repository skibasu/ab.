import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { backgroundColor: theme.backgroundColor.default },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing[3],
      paddingHorizontal: theme.spacing[6],
    },
  });
