import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import ResendVerificationLink from '@/components/auth/ResendVerificationLink/ResendVerificationLink';
import AppButton from '@/components/ui/AppButton/AppButton';
import IconBadge from '@/components/ui/IconBadge/IconBadge';
import Title from '@/components/ui/Title/Title';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type RegisterSuccessScreenProps = { email: string };

const RegisterSuccessScreen = ({ email }: RegisterSuccessScreenProps) => {
  const router = useRouter();
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <ScrollView
      style={localStyles.viewport}
      contentContainerStyle={localStyles.container}
    >
      <View style={localStyles.content}>
        <IconBadge icon="envelope" />
        <Title
          text="Check your inbox"
          accessibilityRole="header"
          style={localStyles.title}
        />
        <View style={localStyles.recipient}>
          <Text style={localStyles.description}>
            Your account is ready. We sent a verification link to
          </Text>
          <Text
            selectable
            style={localStyles.email}
          >
            {email}
          </Text>
        </View>
        <View style={localStyles.instructions}>
          <Text style={localStyles.instruction}>Open the link, then return here to log in.</Text>
          <View style={localStyles.support}>
            <Text style={localStyles.help}>No email? Check your spam or junk folder.</Text>
            <ResendVerificationLink />
          </View>
        </View>
      </View>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label="Back to login"
          onPress={() => router.dismissTo('/login')}
        />
      </View>
    </ScrollView>
  );
};

export default RegisterSuccessScreen;
