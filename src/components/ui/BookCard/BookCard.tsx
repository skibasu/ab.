import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { DEFAULT_BOOK_COVER_PATH } from '@/constants/book-cover';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryBook } from '@/services/book-repository';
import { formatDuration } from '@/utils/format-duration';
import { styles } from './styles';

const sampleCover = require('@/assets/images/sample-cover.png');

export type BookCardProps = {
  book: Pick<LibraryBook, 'title' | 'author' | 'coverPath' | 'duration'>;
  variant?: 'minimal' | 'full';
  progressLabel?: string;
  showDuration?: boolean;
  showProgress?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const BookCard = ({
  book,
  variant = 'minimal',
  progressLabel = 'Not started · 0%',
  showDuration = true,
  showProgress = true,
  onPress,
  style,
}: BookCardProps) => {
  const localStyles = styles(useAppTheme());
  const isFull = variant === 'full';
  const source =
    !book.coverPath?.trim() || book.coverPath === DEFAULT_BOOK_COVER_PATH
      ? sampleCover
      : { uri: new File(Paths.document, book.coverPath).uri };

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open ${book.title} by ${book.author}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.card,
        isFull ? localStyles.full : localStyles.minimal,
        pressed && localStyles.pressed,
        style,
      ]}
    >
      <View style={[localStyles.coverFrame, isFull && localStyles.fullCoverFrame]}>
        <Image
          source={source}
          placeholder={sampleCover}
          placeholderContentFit="cover"
          style={localStyles.cover}
          contentFit="cover"
          transition={450}
          recyclingKey={book.coverPath}
          accessible={false}
        />
      </View>
      <View style={isFull ? localStyles.fullDetails : localStyles.minimalDetails}>
        <Text style={isFull ? localStyles.fullTitle : localStyles.title}>{book.title}</Text>
        <Text style={localStyles.author}>{book.author}</Text>
        {isFull && showDuration && (
          <Text style={localStyles.metadata}>
            {book.duration === null ? 'Duration · —' : `${formatDuration(book.duration)} total`}
          </Text>
        )}
        {isFull && showProgress && <Text style={localStyles.progress}>{progressLabel}</Text>}
      </View>
    </Pressable>
  );
};

export default memo(BookCard);
