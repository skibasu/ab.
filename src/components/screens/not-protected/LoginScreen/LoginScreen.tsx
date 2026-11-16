import LoginForm from '@/components/screens/not-protected/LoginScreen/LoginForm/LoginForm';
import { styles } from '@/components/screens/not-protected/LoginScreen/styles';
import ActionLink from '@/components/ui/ActionLink/ActionLink';
import Logo from '@/components/ui/Logo/Logo';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import Subtitle from '@/components/ui/Subtitle/Subtitle';
import { useAppTheme } from '@/hooks/use-app-theme';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

const Login = () => {
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
          title="Sign In"
          subtitle="Bring your books. Find your rhythm."
        />
        <LoginForm>
          <View style={localStyles.loginContainer}>
            <Subtitle
              style={localStyles.loginSubtitle}
              text="New here?"
            />
            <ActionLink
              href="/(auth)/register"
              text="Create an account"
              style={localStyles.loginActions}
            >
              <Subtitle text=" or continue" />
            </ActionLink>
          </View>
        </LoginForm>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
