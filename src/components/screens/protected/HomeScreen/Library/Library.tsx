import { useBookImportStore } from '@/stores/book-import-store';
import { buildLibraryRows } from '@/utils/library-rows';
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
  const activeImport = useBookImportStore((state) => state.activeImport);
  const rows = buildLibraryRows(books, activeImport);

  return (
    <FlatList
      data={rows}
      keyExtractor={(book) => book.id}
      numColumns={2}
      style={localStyles.viewport}
      contentContainerStyle={[localStyles.content, rows.length === 0 && localStyles.container]}
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
      renderItem={({ item }) => (
        <BookCard
          book={item.book}
          coverUri={item.coverUri}
          coverKey={item.id}
          importProgress={item.progress}
          variant="minimal"
          style={localStyles.card}
          onPress={
            item.savedId && item.progress === undefined
              ? () => router.push({ pathname: '/playing', params: { bookId: item.savedId! } })
              : undefined
          }
        />
      )}
    />
  );
};
