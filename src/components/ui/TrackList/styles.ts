import { StyleSheet } from 'react-native';

import { styles as globalStyles } from '@/styles/globalStyles';
import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    trackList: { minHeight: 0 },
    heading: {
      ...theme.textStyles.sectionHeading,
      color: theme.textColor.primary,
      paddingHorizontal: theme.spacing[6],
      paddingVertical: theme.spacing[2],
    },
    content: {
      paddingHorizontal: theme.spacing[6],
      paddingBottom: theme.spacing[3],
      gap: theme.spacing[1],
    },
    empty: {
      ...theme.textStyles.body,
      color: theme.textColor.secondary,
      paddingVertical: theme.spacing[6],
    },
  }),
});
