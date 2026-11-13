import { StyleSheet } from 'react-native';

import { styles as authStyles } from '@/components/auth/styles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => ({
  ...authStyles(theme),
  ...StyleSheet.create({
    signInContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    signInSubtitle: {
      paddingHorizontal: 40,
    },
    signInActions: {
      paddingHorizontal: 40,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
  }),
});
