import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { themeConfig } from '@/theme';

//ab.

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: themeConfig.spacing[6],
    alignItems: 'center',
    gap: themeConfig.spacing[4],
    paddingBottom: (Platform.select({ ios: 50, android: 80 }) ?? 0) + themeConfig.spacing[4],
    maxWidth: 800,
  },
});
