import { StyleSheet } from 'react-native';

import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    screen: {
      backgroundColor: theme.backgroundColor.screen,
      backgroundImage: `linear-gradient(to bottom, ${theme.backgroundGradient.screen.colors.join(', ')})`,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[6],
      paddingTop: theme.spacing[2],
    },
    headerTitle: {
      ...theme.textStyles.sectionHeading,
      color: theme.textColor.primary,
      textAlign: 'center',
      flex: 1,
    },
    player: { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[2] },
  }),
});
