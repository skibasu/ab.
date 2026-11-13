import { View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { useAuthStore } from '@/stores/auth-store';
import { styles } from './styles';

const Form = () => {
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);

  return (
    <View style={styles.container}>
      <AppInput placeholder="Email" />
      <AppInput
        placeholder="Password"
        secureTextEntry
        withError={false}
      />
      <AppButton
        label="Login"
        onPress={() => setIsAuthenticated(true)}
      />
    </View>
  );
};

export default Form;
