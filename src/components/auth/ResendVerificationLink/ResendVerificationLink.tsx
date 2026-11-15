import { Pressable, Text } from 'react-native';

import { styles } from '@/components/ui/AppLink/styles';
import { useAppTheme } from '@/hooks/use-app-theme';

const ResendVerificationLink = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Resend verification email"
      style={localStyles.container}
    >
      {({ pressed }) => (
        <Text style={[localStyles.text, pressed && localStyles.pressed]}>
          Resend verification email
        </Text>
      )}
    </Pressable>
  );
};

export default ResendVerificationLink;
