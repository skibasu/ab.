import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import AppInput from '@/components/ui/AppInput/AppInput';
import { AUTH_FORM_DEFAULT_VALUES } from '@/constants/auth-form-defaults';
import { styles } from './styles';
import { registerSchema } from './validation/registerSchema';

const Form = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: AUTH_FORM_DEFAULT_VALUES,
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const submit = handleSubmit(() => Keyboard.dismiss());

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
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <AppButton
        label="Create account"
        loading={isSubmitting}
        onPress={() => void submit()}
      />
    </View>
  );
};

export default Form;
