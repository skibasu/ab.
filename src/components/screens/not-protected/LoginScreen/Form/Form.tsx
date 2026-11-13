import { View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { styles } from './styles';

const Form = () => (
  <View style={styles.container}>
    <AppInput placeholder="Email" />
    <AppInput
      placeholder="Password"
      secureTextEntry
      withError={false}
    />
    <AppButton label="Login" />
  </View>
);

export default Form;
