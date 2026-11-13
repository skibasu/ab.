import AppButton from '@/components/ui/AppButton/AppButton';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ScrollView, View } from 'react-native';
import { styles } from './styles';

const HomeScreen = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <>
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
      >
        <MainTitleBlock
          title="Library"
          subtitle="Bring your books. Find your rhythm."
        />
      </ScrollView>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label="Import"
          icon="import"
          accessibilityLabel="Import audiobooks"
        />
      </View>
    </>
  );
};

export default HomeScreen;
