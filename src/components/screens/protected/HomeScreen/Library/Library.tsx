import MainTitleBlock from '@/components/ui/MainTitleBlock/MainTitleBlock';
import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLibraryStore } from '@/stores/library-store';
import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { styles } from './styles';

const sampleCover = require('../../../../../../assets/images/sample-cover.png');

export const Library = () => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const books = useLibraryStore((state) => state.books);

  return books.length > 0 ? (
    <View style={localStyles.container}>
      {books.map((book) => (
        <View
          key={book.id}
          style={localStyles.cart}
        >
          <View style={localStyles.coverFrame}>
            <Image
              source={
                !book.coverPath?.trim() || book.coverPath === DEFAULT_BOOK_COVER_PATH
                  ? sampleCover
                  : { uri: new File(Paths.document, book.coverPath).uri }
              }
              placeholder={sampleCover}
              placeholderContentFit="cover"
              style={localStyles.cover}
              contentFit="cover"
              transition={450}
            />
          </View>
          <Text style={localStyles.title}>{book.title}</Text>
          <Text style={localStyles.author}>{book.author}</Text>
        </View>
      ))}
    </View>
  ) : (
    <MainTitleBlock
      title="Library"
      subtitle="Bring your books. Find your rhythm."
    />
  );
};
