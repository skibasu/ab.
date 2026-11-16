import ResetPasswordScreen from '@/components/screens/not-protected/ResetPasswordScreen/ResetPasswordScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';

export default function EmailNotVerified() {
  return (
    <AppSafeArea>
      <ResetPasswordScreen />
    </AppSafeArea>
  );
}
