import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './styles';

type AppSafeAreaProps = { children: React.ReactNode };
const AppSafeArea = ({ children }: AppSafeAreaProps) => (
  <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
);

export default AppSafeArea;
