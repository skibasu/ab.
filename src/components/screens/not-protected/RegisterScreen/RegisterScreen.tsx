import ProviderButtonsList from '@/components/auth/ProviderButtonsList/ProviderButtonsList';
import Form from '@/components/screens/not-protected/RegisterScreen/Form/Form';
import { styles } from '@/components/screens/not-protected/RegisterScreen/style';
import AppLink from '@/components/ui/AppLink/AppLink';
import Logo from '@/components/ui/Logo/Logo';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import Subtitle from '@/components/ui/Subtitle/Subtitle';
import { useAppTheme } from '@/hooks/use-app-theme';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

const Register = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <KeyboardAvoidingView
      style={localStyles.viewport}
      enabled={Platform.OS === 'android'}
      behavior="height"
    >
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Logo variant="medium" />
        <MainTitleBlock
          title="Create account"
          subtitle="Create an account for your audiobooks."
        />
        <Form />
        <View style={localStyles.signInContainer}>
          <Subtitle
            style={localStyles.signInSubtitle}
            text="Already have an account?"
          />
          <View style={localStyles.signInActions}>
            <AppLink
              href="/(auth)/login"
              text="Sign in"
            />
            <Subtitle text=" or sign in with:" />
          </View>
        </View>
        <ProviderButtonsList labelPrefix="Continue with" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
