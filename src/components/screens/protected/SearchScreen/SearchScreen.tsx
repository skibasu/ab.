import { styles } from '@/components/screens/protected/SearchScreen/styles';
import Accordion from '@/components/ui/Accordion/Accordion';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ScrollView, View } from 'react-native';

const Search = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return (
    <>
      <ScrollView
        style={localStyles.viewport}
        contentContainerStyle={localStyles.container}
      ></ScrollView>
      <View style={localStyles.buttonContainer}>
        <Accordion
          title="Filters"
          iconName="filters"
        />
      </View>
    </>
  );
};

export default Search;
