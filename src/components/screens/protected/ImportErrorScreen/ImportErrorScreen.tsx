import { ScrollView, Text, View } from 'react-native';

import AppButton from '@/components/ui/AppButton/AppButton';
import IconBadge from '@/components/ui/IconBadge/IconBadge';
import Title from '@/components/ui/Title/Title';
import { IMPORT_ERROR_CONTENT } from '@/constants/import-error';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type ImportErrorScreenProps = {
  title: string;
  message: string;
  partial?: boolean;
  onChooseFiles: () => void;
  onBackToLibrary: () => void;
};

const ImportErrorScreen = ({
  title,
  message,
  partial = false,
  onChooseFiles,
  onBackToLibrary,
}: ImportErrorScreenProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <ScrollView
      style={localStyles.viewport}
      contentContainerStyle={localStyles.container}
    >
      <View style={localStyles.status}>
        <IconBadge
          icon="alert"
          color={theme.colors.amber[400]}
        />
        <Title
          text={title}
          accessibilityRole="header"
          style={localStyles.title}
        />
        <Text
          accessibilityRole="alert"
          style={localStyles.message}
        >
          {message}
        </Text>
        {partial && <Text style={localStyles.message}>{IMPORT_ERROR_CONTENT.partial}</Text>}
      </View>
      <View style={localStyles.actions}>
        <AppButton
          label={IMPORT_ERROR_CONTENT.chooseFiles}
          onPress={onChooseFiles}
        />
        <AppButton
          label={IMPORT_ERROR_CONTENT.backToLibrary}
          variant="ghost"
          style={localStyles.secondaryButton}
          labelStyle={localStyles.secondaryLabel}
          onPress={onBackToLibrary}
        />
      </View>
    </ScrollView>
  );
};
export default ImportErrorScreen;
