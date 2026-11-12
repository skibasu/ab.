import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { themeConfig } from '@/theme/config';

type AppSafeAreaProps = { children: React.ReactNode };
const AppSafeArea = ({ children }: AppSafeAreaProps) => (
  <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    gap: themeConfig.spacing[4],
    maxWidth: 800,
  },
});

export default AppSafeArea;
