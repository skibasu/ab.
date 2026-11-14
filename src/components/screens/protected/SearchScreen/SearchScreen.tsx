import { styles } from '@/components/screens/protected/SearchScreen/styles';
import Accordion from '@/components/ui/Accordion/Accordion';
import FiltersMenu from '@/components/ui/FiltersMenu/FiltersMenu';
import InfoPanel from '@/components/ui/InfoPanel/InfoPanel';
import SearchInput from '@/components/ui/SearchInput/SearchInput';
import { SEARCH_FILTERS } from '@/constants/search-filters';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useHeaderHeight } from 'expo-router/build/react-navigation/elements/Header/useHeaderHeight.js';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

const Search = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const headerHeight = useHeaderHeight();
  const [query, setQuery] = useState('');

  return (
    <KeyboardAvoidingView
      style={localStyles.viewport}
      enabled={Platform.OS === 'ios'}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
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
        <InfoPanel
          icon="books"
          title="Find an audiobook"
          message="Search your library by title or author."
        />
      </ScrollView>
      <View style={localStyles.buttonContainer}>
        <Accordion
          title="Filters"
          iconName="filters"
        >
          <FiltersMenu
            title="Search"
            description="Default matches both title and author."
            filters={SEARCH_FILTERS}
          />
        </Accordion>
        <SearchInput
          value={query}
          onChangeText={setQuery}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Search;
