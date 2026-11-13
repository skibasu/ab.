import ProviderButtonsList from '@/components/auth/ProviderButtonsList/ProviderButtonsList';
import Form from '@/components/screens/not-protected/LoginScreen/Form/Form';
import { styles } from '@/components/screens/not-protected/LoginScreen/styles';
import Logo from '@/components/ui/Logo/Logo';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import Subtitle from '@/components/ui/Subtitle/Subtitle';
import { useAppTheme } from '@/hooks/use-app-theme';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

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
        <Subtitle text="New here? Create an account or continue" />
        <ProviderButtonsList />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
