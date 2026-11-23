import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import Actions from '@/components/ui/Actions/Actions';
import BookCard from '@/components/ui/BookCard/BookCard';
import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import InfoPanel from '@/components/ui/InfoPanel/InfoPanel';
import PlaybackPanel from '@/components/ui/PlaybackPanel/PlaybackPanel';
import TrackList from '@/components/ui/TrackList/TrackList';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryTrack } from '@/services/book-repository';
import { useAuthStore } from '@/stores/auth-store';
import { useLibraryStore } from '@/stores/library-store';
import { styles } from './styles';

type PlayingScreenProps = { bookId?: string };

const PlayingScreen = ({ bookId }: PlayingScreenProps) => {
  const localStyles = styles(useAppTheme());
  const userId = useAuthStore((state) => state.user?.uid);
  const book = useLibraryStore((state) =>
    state.books.find((item) => item.id === bookId && item.userId === userId),
  );
  const [selection, setSelection] = useState<{ bookId: string; trackId: string }>();
  const selectedTrack =
    book?.tracks.find((track) => selection?.bookId === book.id && track.id === selection.trackId) ??
    book?.tracks[0];
  const selectTrack = useCallback(
    (track: LibraryTrack) => {
      if (bookId) setSelection({ bookId, trackId: track.id });
    },
    [bookId],
  );

  return (
    <View style={[localStyles.viewport, localStyles.screen]}>
      <View style={localStyles.header}>
        <ButtonHeader
          icon="back"
          label="Back to Library"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <Text
          accessibilityRole="header"
          style={localStyles.headerTitle}
        >
          Audiobook
        </Text>
        <Actions iconList={['settings']} />
      </View>
      {book ? (
        <>
          <BookCard
            book={book}
            variant="full"
          />
          <TrackList
            tracks={book.tracks}
            selectedTrackId={selectedTrack?.id}
            onTrackPress={selectTrack}
          />
          {selectedTrack && (
            <View style={localStyles.player}>
              <PlaybackPanel track={selectedTrack} />
            </View>
          )}
        </>
      ) : (
        <View style={localStyles.container}>
          <InfoPanel
            icon="books"
            title="Book unavailable"
            message={LIBRARY_ERROR_MESSAGES.bookUnavailable}
          />
        </View>
      )}
    </View>
  );
};

export default PlayingScreen;
