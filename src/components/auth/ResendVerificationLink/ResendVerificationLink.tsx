import { AUTH_ERROR_MESSAGES } from '@/constants/errors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { resendVerificationEmail } from '@/services/firebase';
import { getAuthErrorMessage } from '@/services/firebase-auth-errors';
import { useAuthStore } from '@/stores/auth-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './styles';

const ResendVerificationLink = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const { user } = useAuthStore();
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLinkPress = async () => {
    if (isResending) return;

    setResendError('');
    setResendSuccess(false);

    if (!user) {
      setResendError(AUTH_ERROR_MESSAGES.verificationUserMissing);
      return;
    }

    setIsResending(true);

    try {
      const storageKey = `verificationResendAvailableAt:${user.uid}`;
      const stored = await AsyncStorage.getItem(storageKey);
      const timestamp = stored === null ? 0 : Number(stored);
      const resendAvailableAt = Number.isFinite(timestamp) ? timestamp : 0;
      const secondsLeft = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));

      if (secondsLeft > 0) {
        setResendError(AUTH_ERROR_MESSAGES.verificationResendCooldown(secondsLeft));
        return;
      }

      await resendVerificationEmail();
      setResendSuccess(true);
    } catch (error) {
      setResendError(getAuthErrorMessage(error, 'verificationLinkResend'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={localStyles.rootContainer}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Resend verification email"
        style={localStyles.linkContainer}
        onPress={handleLinkPress}
        disabled={isResending}
      >
        {({ pressed }) => (
          <Text style={[localStyles.text, pressed && localStyles.pressed]}>
            Resend verification email
          </Text>
        )}
      </Pressable>
      {resendError && <Text style={localStyles.textError}>{resendError}</Text>}
      {resendSuccess && (
        <Text style={localStyles.textSuccess}>
          Verification email has been resent successfully.
        </Text>
      )}
    </View>
  );
};

export default ResendVerificationLink;
