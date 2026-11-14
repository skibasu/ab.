import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { useAuthStore } from '@/stores/auth-store';
import { styles } from './styles';
import { loginSchema } from './validation/loginSchema';

const Form = () => {
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: AUTH_FORM_DEFAULT_VALUES,
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const submit = handleSubmit(() => setIsAuthenticated(true));

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
      <AppButton
        label="Login"
        loading={isSubmitting}
        onPress={() => void submit()}
      />
    </View>
  );
};

export default Form;
