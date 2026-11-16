import ProviderButtonsList from '@/components/auth/ProviderButtonsList/ProviderButtonsList';
import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { useFormContext } from '@/context/useFormContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { login } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Text, View } from 'react-native';
import { styles } from './styles';
import { loginSchema } from './validation/loginSchema';

export type FormArgs = [email: string, password: string];

export type AsyncCallback = (...args: FormArgs) => Promise<void>;

type LoginFormProps = {
  children?: React.ReactNode;
};
const LoginForm = ({ children }: LoginFormProps) => {
  const { isGoogleSigningIn, isAppleSigningIn, isMicrosoftSigningIn } = useFormContext();
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: AUTH_FORM_DEFAULT_VALUES,
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const submitForm = async (callback: AsyncCallback): Promise<void> =>
    handleSubmit(async ({ email, password }) => {
      Keyboard.dismiss();
      await callback(email, password);
    })();

  const submitCallback = async (email: string, password: string) => {
    const { user } = await login(email, password);
    if (!user.emailVerified) {
      router.replace({ pathname: '/email-not-verified', params: { email } });
    }
  };

  const handleLoginPress = () => {
    void submitForm(submitCallback).catch((error: unknown) => {
      setError('root.auth', {
        message: getAuthErrorMessage(error, 'login'),
      });
    });
  };
  const authError = errors.root?.auth?.message;

  return (
    <>
      <View style={localStyles.container}>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <AppInput
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <AppInput
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        {authError && (
          <Text
            style={localStyles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {authError}
          </Text>
        )}
        <AppButton
          label="Login"
          loading={isSubmitting}
          disabled={isGoogleSigningIn || isAppleSigningIn || isMicrosoftSigningIn}
          onPress={handleLoginPress}
        />
      </View>
      {children}
      <ProviderButtonsList disabled={isSubmitting} />
    </>
  );
};

export default LoginForm;
