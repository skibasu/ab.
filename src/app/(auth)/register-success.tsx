import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import RegisterSuccessScreen from '@/components/screens/not-protected/RegisterSuccessScreen/RegisterSuccessScreen';
import AppSafeArea from '@/components/ui/AppSafeArea/AppSafeArea';
import { styles } from '@/components/screens/not-protected/RegisterSuccessScreen/style';
import { useAppTheme } from '@/hooks/use-app-theme';

const RegisterSuccess = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const recipientEmail = (Array.isArray(email) ? email[0] : email)?.trim();

  if (!recipientEmail) return <Redirect href="/register" />;

  return (
    <View style={localStyles.background}>
      <AppSafeArea>
        <RegisterSuccessScreen email={recipientEmail} />
      </AppSafeArea>
    </View>
  );
};

export default RegisterSuccess;
