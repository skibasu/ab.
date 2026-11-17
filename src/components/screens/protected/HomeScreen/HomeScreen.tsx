import AppButton from '@/components/ui/AppButton/AppButton';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import { useAppTheme } from '@/hooks/use-app-theme';
import { pickBookFiles } from '@/services/book-file-picker';
import { readBookFilesMetadata } from '@/services/book-metadata';
import { groupFiles } from '@/utils/group-files';
import { ScrollView, View } from 'react-native';
import AppPlayer from './Player';
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
        <AppPlayer />
      </ScrollView>
      <View style={localStyles.buttonContainer}>
        <AppButton
          label="Import"
          icon="import"
          accessibilityLabel="Import audiobooks"
          onPress={async () => {
            try {
              const files = await pickBookFiles('audio/mpeg');

              if (files.length === 0) return;
              const filesWithMetadata = await readBookFilesMetadata(files);
              const groupedFiles = groupFiles(filesWithMetadata);
              console.log('Selected audio files:', files);
              console.log('Audio files with metadata:', filesWithMetadata);
              console.log('Grouped files:', groupedFiles);
            } catch (error) {
              console.error('Failed to select audio files:', error);
            }
          }}
        />
      </View>
    </>
  );
};

export default HomeScreen;
