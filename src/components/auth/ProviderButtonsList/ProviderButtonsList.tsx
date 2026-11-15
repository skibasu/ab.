import { Fragment, useState } from 'react';
import { Platform, Text, View } from 'react-native';

import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import { AUTH_PROVIDERS } from '@/constants/auth-providers';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { signInWithGoogle } from '@/services/google-sign-in';
import { styles } from './styles';

type ProviderButtonsListProps = {
  labelPrefix?: 'Login with' | 'Continue with';
};

const ProviderButtonsList = ({ labelPrefix = 'Login with' }: ProviderButtonsListProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleError, setGoogleError] = useState<string>();

  const handleGoogleSignIn = async () => {
    setGoogleError(undefined);
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleError(getAuthErrorMessage(error, 'googleSignIn'));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <View style={localStyles.container}>
      {AUTH_PROVIDERS.map((provider) => {
        const isGoogle = provider.icon === 'google';
        const isApple = provider.icon === 'apple';
        const isMicrosoft = provider.icon === 'microsoft';

        const isServiceDisabled = (isGoogle && Platform.OS !== 'ios') || isApple || isMicrosoft;
        return (
          <Fragment key={provider.icon}>
            <ButtonProvider
              icon={provider.icon}
              label={`${labelPrefix} ${provider.label}`}
              disabled={isServiceDisabled}
              loading={isGoogle && isGoogleSigningIn}
              onPress={
                isGoogle ? handleGoogleSignIn : () => console.log(`${provider.label} login pressed`)
              }
            />
            {isGoogle && googleError && (
              <Text
                style={localStyles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {googleError}
              </Text>
            )}
          </Fragment>
        );
      })}
    </View>
  );
};

export default ProviderButtonsList;
