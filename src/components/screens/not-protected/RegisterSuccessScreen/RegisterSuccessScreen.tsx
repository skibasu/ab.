import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import AppButton from '@/components/ui/AppButton/AppButton';
import IconBadge from '@/components/ui/IconBadge/IconBadge';
import Title from '@/components/ui/Title/Title';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './style';

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
          <ThemedText
            themeColor="secondary"
            style={localStyles.description}
          >
            Your account is ready. We sent a verification link to
          </ThemedText>
          <ThemedText
            selectable
            style={localStyles.email}
          >
            {email}
          </ThemedText>
        </View>
        <View style={localStyles.instructions}>
          <ThemedText
            themeColor="secondary"
            style={localStyles.instruction}
          >
            Open the link, then return here to log in.
          </ThemedText>
          <ThemedText
            themeColor="secondary"
            style={localStyles.help}
          >
            No email? Check your spam or junk folder.
          </ThemedText>
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
