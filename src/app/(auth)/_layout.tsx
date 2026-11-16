import { FormProvider } from '@/context/useFormContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <FormProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="register-success" />
        <Stack.Screen name="email-not-verified" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="reset-success" />
      </Stack>
    </FormProvider>
  );
}
