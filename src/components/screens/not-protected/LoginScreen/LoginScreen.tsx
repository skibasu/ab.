import ProviderButtonsList from '@/components/auth/ProviderButtonsList/ProviderButtonsList';
import Form from '@/components/screens/not-protected/LoginScreen/Form/Form';
import { styles } from '@/components/screens/not-protected/LoginScreen/styles';
import AppLink from '@/components/ui/AppLink/AppLink';
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
        <Form />
        <View style={localStyles.loginContainer}>
          <Subtitle
            style={localStyles.loginSubtitle}
            text="New here?"
          />
          <View style={localStyles.loginActions}>
            <AppLink
              href="/(auth)/register"
              text="Create an account"
            />
            <Subtitle text=" or continue" />
          </View>
        </View>
        <ProviderButtonsList />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
