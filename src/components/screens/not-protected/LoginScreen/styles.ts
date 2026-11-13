import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing[6],
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
  });
