import ResetForm from '@/components/screens/not-protected/ResetPasswordScreen/ResetPasswordForm/ResetPasswordForm';
import { styles } from './style';

import Logo from '@/components/ui/Logo/Logo';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import Subtitle from '@/components/ui/Subtitle/Subtitle';
import { useAppTheme } from '@/hooks/use-app-theme';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

const ResetPassword = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <KeyboardAvoidingView
      style={localStyles.viewport}
      enabled={Platform.OS === 'android'}
      behavior="height"
    >
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Logo variant="medium" />
        <MainTitleBlock
          title="Reset password"
          subtitle="Enter your email to reset your password."
        />
        <ResetForm>
          <View style={localStyles.resetContainer}>
            <Subtitle
              style={localStyles.resetSubtitle}
              text="We'll email you a link to choose a new password.
Check your spam folder if you don't see it."
            />
          </View>
        </ResetForm>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
