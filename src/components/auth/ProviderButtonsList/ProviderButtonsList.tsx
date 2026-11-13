import { View } from 'react-native';

import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import { styles } from './styles';

type ProviderButtonsListProps = {
  labelPrefix?: 'Login with' | 'Continue with';
};

const ProviderButtonsList = ({ labelPrefix = 'Login with' }: ProviderButtonsListProps) => (
  <View style={styles.container}>
    <ButtonProvider
      icon="apple"
      label={`${labelPrefix} Apple`}
      onPress={() => console.log('Apple login pressed')}
    />
    <ButtonProvider
      icon="google"
      label={`${labelPrefix} Google`}
      onPress={() => console.log('Google login pressed')}
    />
    <ButtonProvider
      icon="microsoft"
      label={`${labelPrefix} Microsoft`}
      onPress={() => console.log('Microsoft login pressed')}
    />
  </View>
);

export default ProviderButtonsList;
