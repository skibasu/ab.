import BookCard from '@/components/ui/BookCard/BookCard';
import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList } from 'react-native';
import { styles } from './styles';

export const Library = ({ isImporting }: { isImporting: boolean }) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const books = useLibraryStore((state) => state.books);

  return (
    <FlatList
      data={books}
      keyExtractor={(book) => book.id}
      numColumns={2}
      style={localStyles.viewport}
      contentContainerStyle={[localStyles.content, books.length === 0 && localStyles.container]}
      columnWrapperStyle={localStyles.row}
      ListEmptyComponent={
        isImporting ? (
          <ActivityIndicator
            accessibilityLabel="Importing audiobooks"
            accessibilityRole="progressbar"
            color={theme.tintColor.primary}
            size="large"
          />
        ) : (
          <MainTitleBlock
            title="Library"
            subtitle="Bring your books. Find your rhythm."
          />
        )
      }
      renderItem={({ item: book }) => (
        <BookCard
          book={book}
          variant="minimal"
          style={localStyles.card}
          onPress={() => router.push({ pathname: '/playing', params: { bookId: book.id } })}
        />
      )}
    />
  );
};
