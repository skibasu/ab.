import { View } from 'react-native';

import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import { AUTH_PROVIDERS } from '@/constants/auth-providers';
import { styles } from './styles';

type ProviderButtonsListProps = {
  labelPrefix?: 'Login with' | 'Continue with';
};

const ProviderButtonsList = ({ labelPrefix = 'Login with' }: ProviderButtonsListProps) => (
  <View style={styles.container}>
    {AUTH_PROVIDERS.map((provider) => (
      <ButtonProvider
        key={provider.icon}
        icon={provider.icon}
        label={`${labelPrefix} ${provider.label}`}
        onPress={() => console.log(`${provider.label} login pressed`)}
      />
    ))}
  </View>
);

export default ProviderButtonsList;
