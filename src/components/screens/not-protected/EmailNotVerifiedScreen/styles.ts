import { StyleSheet } from 'react-native';

import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    content: { width: '100%', alignItems: 'center', gap: theme.spacing[6] },
    title: { width: '100%', textAlign: 'center' },
    recipient: { width: '100%', gap: theme.spacing[1] },
    description: {
      color: theme.textColor.secondary,
      ...theme.textStyles.bodyLarge,
      textAlign: 'center',
    },
    email: {
      color: theme.textColor.primary,
      ...theme.textStyles.bodyEmphasis,
      textAlign: 'center',
    },
    instructions: { width: '100%', gap: theme.spacing[6] },
    instruction: {
      color: theme.textColor.secondary,
      ...theme.textStyles.body,
      textAlign: 'center',
    },
    help: { color: theme.textColor.secondary, ...theme.textStyles.helperText, textAlign: 'center' },
    support: { width: '100%', alignItems: 'center' },
    buttonContainer: { width: '100%' },
  }),
});
