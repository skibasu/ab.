import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { AUTH_ERROR_MESSAGES } from '@/constants/errors';
import { register } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { styles } from './styles';
import { registerSchema } from './validation/registerSchema';

const Form = () => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({
    defaultValues: AUTH_FORM_DEFAULT_VALUES,
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const submit = handleSubmit(async ({ email, password }) => {
    Keyboard.dismiss();
    const { verificationEmailSent } = await register(email, password);
    if (!verificationEmailSent) {
      setError('root.auth', {
        message: AUTH_ERROR_MESSAGES.verificationEmailFailed,
      });
    }
  });

  const handleRegisterPress = () => {
    void submit().catch((error: unknown) => {
      setError('root.auth', {
        message: getAuthErrorMessage(error, 'register'),
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
            editable={!isSubmitting && !isSubmitSuccessful}
            placeholder="you@example.com"
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
            editable={!isSubmitting && !isSubmitSuccessful}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      {isSubmitSuccessful ? (
        <ThemedText
          type="small"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          Check your email to verify your account.
        </ThemedText>
      ) : authError ? (
        <ThemedText
          type="small"
          themeColor="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {authError}
        </ThemedText>
      ) : null}
      <AppButton
        label="Create account"
        loading={isSubmitting}
        disabled={isSubmitSuccessful}
        onPress={handleRegisterPress}
      />
    </View>
  );
};

export default Form;
