import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: theme.spacing[3],
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    title: { ...theme.textStyles.screenTitle, color: theme.textColor.primary },
    subtitle: { ...theme.textStyles.metadata, color: theme.textColor.secondary },
  });
