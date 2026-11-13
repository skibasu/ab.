import { StyleSheet } from 'react-native';

import { styles as authStyles } from '@/components/auth/styles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => ({
  ...authStyles(theme),
  ...StyleSheet.create({
    registerContainer: {
      paddingHorizontal: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    registerSubtitle: {
      textAlign: 'center',
    },
    registerActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
});
