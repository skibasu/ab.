import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.backgroundGradient.screen.colors[0],
      backgroundImage: `linear-gradient(to bottom, ${theme.backgroundGradient.screen.colors.join(', ')})`,
    },

    content: { width: '100%', alignItems: 'center', gap: theme.spacing[6] },
    title: { width: '100%', textAlign: 'center' },
    recipient: { width: '100%', gap: theme.spacing[1] },
    description: { ...theme.textStyles.bodyLarge, textAlign: 'center' },
    email: { ...theme.textStyles.bodyEmphasis, textAlign: 'center' },
    instructions: { width: '100%', gap: theme.spacing[8] },
    instruction: { ...theme.textStyles.body, textAlign: 'center' },
    help: { ...theme.textStyles.helperText, textAlign: 'center' },
    buttonContainer: {
      width: '100%',
    },
  }),
});
