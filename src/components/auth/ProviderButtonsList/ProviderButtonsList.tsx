import { Fragment, useState } from 'react';
import { Platform, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import { AUTH_PROVIDERS } from '@/constants/auth-providers';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { signInWithGoogle } from '@/services/google-sign-in';
import { styles } from './styles';

type ProviderButtonsListProps = {
  labelPrefix?: 'Login with' | 'Continue with';
};

const ProviderButtonsList = ({ labelPrefix = 'Login with' }: ProviderButtonsListProps) => {
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleError, setGoogleError] = useState<string>();

  const handleGoogleSignIn = async () => {
    setGoogleError(undefined);
    setIsGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setGoogleError(getAuthErrorMessage(error, 'Could not sign in with Google. Try again.'));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      {AUTH_PROVIDERS.map((provider) => {
        const isGoogle = provider.icon === 'google';
        return (
          <Fragment key={provider.icon}>
            <ButtonProvider
              icon={provider.icon}
              label={`${labelPrefix} ${provider.label}`}
              disabled={isGoogle && Platform.OS !== 'ios'}
              loading={isGoogle && isGoogleSigningIn}
              onPress={
                isGoogle ? handleGoogleSignIn : () => console.log(`${provider.label} login pressed`)
              }
            />
            {isGoogle && googleError && (
              <ThemedText
                type="small"
                themeColor="error"
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {googleError}
              </ThemedText>
            )}
          </Fragment>
        );
      })}
    </View>
  );
};

export default ProviderButtonsList;
