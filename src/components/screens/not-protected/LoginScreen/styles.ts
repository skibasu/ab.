import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    loginContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginSubtitle: {
      textAlign: 'center',
    },
    loginActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
});
