import { View } from 'react-native';

import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import { styles } from './styles';

const ProviderButtonsList = () => (
  <View style={styles.container}>
    <ButtonProvider
      icon="apple"
      label="Login with Apple"
      onPress={() => console.log('Apple login pressed')}
    />
    <ButtonProvider
      icon="google"
      label="Login with Google"
      onPress={() => console.log('Google login pressed')}
    />
    <ButtonProvider
      icon="microsoft"
      label="Login with Microsoft"
      onPress={() => console.log('Microsoft login pressed')}
    />
  </View>
);

export default ProviderButtonsList;
