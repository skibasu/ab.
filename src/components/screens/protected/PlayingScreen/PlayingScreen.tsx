import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import Actions from '@/components/ui/Actions/Actions';
import BookCard from '@/components/ui/BookCard/BookCard';
import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import InfoPanel from '@/components/ui/InfoPanel/InfoPanel';
import PlaybackPanel from '@/components/ui/PlaybackPanel/PlaybackPanel';
import TrackList from '@/components/ui/TrackList/TrackList';
import { LIBRARY_ERROR_MESSAGES } from '@/constants/errors';
import { usePlaybackContext } from '@/context/PlaybackContext';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlayingScreenProps = { bookId?: string };

const PlayingScreen = ({ bookId }: PlayingScreenProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const context = usePlaybackContext();
  const { openBook, playback } = context;
  const matches = context.bookId === bookId;
  const book = matches ? context.book : null;
  const isLoading = Boolean(bookId && (!matches || context.isLoading));
  const failed = matches && context.failed;
  const selectedTrack = playback.track;

  useFocusEffect(
    useCallback(() => {
      if (bookId) openBook(bookId);
      // Leaving this screen only removes its UI; the provider retains playback.
    }, [bookId, openBook]),
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
      {isLoading ? (
        <View style={localStyles.container}>
          <ActivityIndicator
            accessibilityLabel="Loading audiobook"
            accessibilityRole="progressbar"
            color={theme.tintColor.primary}
            size="large"
          />
        </View>
      ) : book ? (
        <>
          <BookCard
            book={book}
            variant="full"
          />
          <TrackList
            tracks={book.tracks}
            selectedTrackId={selectedTrack?.id}
            onTrackPress={playback.selectTrack}
          />
          {selectedTrack && (
            <View style={localStyles.player}>
              <PlaybackPanel
                track={selectedTrack}
                playback={playback}
              />
            </View>
          )}
        </>
      ) : (
        <View style={localStyles.container}>
          <InfoPanel
            icon="books"
            title={failed ? 'Could not load audiobook' : 'Book unavailable'}
            message={
              failed
                ? LIBRARY_ERROR_MESSAGES.bookLoadFailed
                : LIBRARY_ERROR_MESSAGES.bookUnavailable
            }
          />
        </View>
      )}
    </View>
  );
};

export default PlayingScreen;
