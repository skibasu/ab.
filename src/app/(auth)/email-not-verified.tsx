import { Redirect, useLocalSearchParams } from 'expo-router';

import EmailNotVerifiedScreen from '@/components/screens/not-protected/EmailNotVerifiedScreen/EmailNotVerifiedScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';

export default function EmailNotVerified() {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const recipientEmail = (Array.isArray(email) ? email[0] : email)?.trim();

  if (!recipientEmail) return <Redirect href="/login" />;

  return (
    <AppSafeArea>
      <EmailNotVerifiedScreen email={recipientEmail} />
    </AppSafeArea>
  );
}
