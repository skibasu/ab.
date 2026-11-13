import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    viewport: {
      flex: 1,
      width: '100%',
    },
    container: {
      flexGrow: 1,
      gap: theme.spacing[6],
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
  });
