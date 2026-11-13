import { styles } from '@/components/screens/not-protected/LoginScreen/styles';
import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import ButtonProvider from '@/components/ui/ButtonProvider/ButtonProvider';
import Logo from '@/components/ui/Logo/Logo';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Text, View } from 'react-native';

const Login = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <View style={localStyles.container}>
      <Logo variant="medium" />
      <Text style={localStyles.title}>Sign In</Text>
      <Text style={localStyles.subtitle}>Bring your books. Find your rhythm.</Text>

      <AppInput
        placeholder="Email"
        label="Email"
        //  error={true}
        //  errorMessage="Invalid email"
      />
      <AppInput
        placeholder="Password"
        secureTextEntry
        label="Password"
        withError={false}
      />

      <AppButton label="Login" />
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
};

export default Login;
