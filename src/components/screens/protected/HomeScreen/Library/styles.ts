import { AppTheme } from '@/theme';
import { StyleSheet } from 'react-native';

import { styles as globalStyles } from '@/styles/globalStyles';

export const styles = (theme: AppTheme) => ({
  ...globalStyles(theme),
  ...StyleSheet.create({
    content: { paddingHorizontal: theme.spacing[6], paddingVertical: theme.spacing[5] },
    row: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    card: { width: '46%', flexGrow: 0 },
  }),
});
