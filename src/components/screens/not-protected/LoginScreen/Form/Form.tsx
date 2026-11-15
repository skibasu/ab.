import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { login } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { styles } from './styles';
import { loginSchema } from './validation/loginSchema';

const Form = () => {
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
  const submit = handleSubmit(async ({ email, password }) => {
    Keyboard.dismiss();
    await login(email, password);
  });

  const handleLoginPress = () => {
    void submit().catch((error: unknown) => {
      setError('root.auth', {
        message: getAuthErrorMessage(error, 'login'),
      });
    });
  };
  const authError = errors.root?.auth?.message;

  return (
    <View style={styles.container}>
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
        <ThemedText
          type="small"
          themeColor="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {authError}
        </ThemedText>
      )}
      <AppButton
        label="Login"
        loading={isSubmitting}
        onPress={handleLoginPress}
      />
    </View>
  );
};

export default Form;
