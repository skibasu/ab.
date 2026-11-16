import RegistrationForm from '@/components/screens/not-protected/RegisterScreen/RegistrationForm/RegistrationForm';
import { styles } from '@/components/screens/not-protected/RegisterScreen/styles';
import ActionLink from '@/components/ui/ActionLink/ActionLink';
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
        <RegistrationForm>
          <View style={localStyles.registerContainer}>
            <Subtitle text="Already have an account?" />
            <ActionLink
              href="/(auth)/login"
              text="Sign in"
              style={localStyles.registerActions}
            >
              <Subtitle text=" or sign in with:" />
            </ActionLink>
          </View>
        </RegistrationForm>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
