import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import AppLink from '@/components/ui/AppLink/AppLink';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { useAppTheme } from '@/hooks/use-app-theme';
import { resetPassword } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Text, View } from 'react-native';
import { styles } from './styles';
import { resetSchema } from './validation/resetSchema';
type LoginFormProps = {
  children?: React.ReactNode;
};
const LoginForm = ({ children }: LoginFormProps) => {
  const router = useRouter();
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: AUTH_FORM_DEFAULT_VALUES,
    resolver: yupResolver(resetSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const submit = handleSubmit(async ({ email }) => {
    Keyboard.dismiss();
    await resetPassword(email);
    router.push({ pathname: '/reset-success', params: { email } });
  });

  const handleResetPress = () => {
    if (isSubmitting) return;

    void submit().catch((error: unknown) => {
      setError('root.auth', {
        message: getAuthErrorMessage(error, 'reset'),
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
          label="Send reset link"
          loading={isSubmitting}
          onPress={handleResetPress}
        />
      </View>
      {children}
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AppLink
          href="/(auth)/login"
          text="Back to Login page"
        />
      </View>
    </>
  );
};

export default LoginForm;
