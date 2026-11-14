import { StyleSheet } from 'react-native';

import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => {
  //const [startColor, endColor] = theme.backgroundGradient.screen.colors;

  return {
    ...globalStyles(theme),
    ...StyleSheet.create({
      buttonContainer: {
        width: '100%',
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[6],
        paddingBottom: theme.spacing[8],
      },
    }),
  };
};
