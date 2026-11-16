import { StyleSheet } from 'react-native';

import { themeConfig } from '@/theme/config';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    gap: themeConfig.spacing[6],
    maxWidth: 800,
  },
});
