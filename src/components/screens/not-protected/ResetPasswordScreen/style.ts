import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    resetContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetSubtitle: {
      textAlign: 'center',
    },
  }),
});
