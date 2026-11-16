import { Redirect, useLocalSearchParams } from 'expo-router';

import RegisterSuccessScreen from '@/components/screens/not-protected/RegisterSuccessScreen/RegisterSuccessScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';

const RegisterSuccess = () => {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const recipientEmail = (Array.isArray(email) ? email[0] : email)?.trim();

  if (!recipientEmail) return <Redirect href="/reset-password" />;

  return (
    <AppSafeArea>
      <RegisterSuccessScreen email={recipientEmail} />
    </AppSafeArea>
  );
};

export default RegisterSuccess;
