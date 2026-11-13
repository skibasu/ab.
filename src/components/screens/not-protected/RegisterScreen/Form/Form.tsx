import { View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { styles } from './styles';

const Form = () => (
  <View style={styles.container}>
    <AppInput
      placeholder="you@example.com"
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType="email-address"
      textContentType="emailAddress"
    />
    <AppInput
      placeholder="Enter your password"
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="newPassword"
      withError={false}
    />
    {/* Registration will be connected when the authentication API is available. */}
    <AppButton label="Create account" />
  </View>
);

export default Form;
