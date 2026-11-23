import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) => ({
  ...StyleSheet.create({
    viewport: {
      ...globalStyles(theme).viewport,
      backgroundColor: theme.backgroundColor.screen,
      backgroundImage: `linear-gradient(to bottom, ${theme.backgroundGradient.screen.colors.join(', ')})`,
    },
    container: {
      ...globalStyles(theme).container,
      justifyContent: 'space-between',
      paddingVertical: theme.spacing[8],
    },
    status: {
      flexGrow: 1,
      width: '100%',
      minHeight: 340,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: theme.spacing[16],
    },
    title: {
      ...theme.textStyles.playerTitle,
      textAlign: 'center',
      width: '100%',
      marginTop: theme.spacing[4.75],
    },
    message: {
      ...theme.textStyles.metadata,
      color: theme.textColor.secondary,
      textAlign: 'center',
      paddingHorizontal: theme.spacing[8],
      marginTop: theme.spacing[3],
    },
    actions: { width: '100%', gap: theme.spacing[3] },
    secondaryLabel: { ...theme.textStyles.sectionHeading },
    secondaryButton: {
      minHeight: theme.spacing[12],
      borderRadius: theme.borderRadius.control,
      paddingVertical: theme.spacing[1.5],
      paddingHorizontal: theme.spacing[3],
    },
  }),
});
