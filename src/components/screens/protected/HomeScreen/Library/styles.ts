import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    cart: { width: '46%', flexGrow: 0 },
    coverFrame: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: theme.borderRadius.control,
      overflow: 'hidden',
    },
    cover: { position: 'absolute', width: '100%', height: '100%' },
    title: { ...theme.textStyles.bookTile, color: theme.textColor.primary },
    author: { ...theme.textStyles.metadata, color: theme.textColor.secondary },
  });
