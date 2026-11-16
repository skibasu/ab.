import ResetSuccessScreen from '@/components/screens/not-protected/ResetSuccessScreen/ResetSuccessScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';
import { Redirect, useLocalSearchParams } from 'expo-router';

const ResetSuccess = () => {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const recipientEmail = (Array.isArray(email) ? email[0] : email)?.trim();

  if (!recipientEmail) return <Redirect href="/register" />;

  return (
    <AppSafeArea>
      <ResetSuccessScreen email={recipientEmail} />
    </AppSafeArea>
  );
};

export default ResetSuccess;
