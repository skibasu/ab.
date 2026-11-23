import { useCallback } from 'react';
import { FlatList, Text, View, type ListRenderItem } from 'react-native';

import Track from '@/components/ui/Track/Track';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryTrack } from '@/services/book-repository';
import { styles } from './styles';

export type TrackListProps = {
  tracks: readonly LibraryTrack[];
  selectedTrackId?: string;
  onTrackPress?: (track: LibraryTrack) => void;
};

const keyExtractor = (track: LibraryTrack) => track.id;

const TrackList = ({ tracks, selectedTrackId, onTrackPress }: TrackListProps) => {
  const localStyles = styles(useAppTheme());
  const renderItem: ListRenderItem<LibraryTrack> = useCallback(
    ({ item, index }) => (
      <Track
        track={item}
        number={index + 1}
        selected={item.id === selectedTrackId}
        onPress={onTrackPress}
      />
    ),
    [onTrackPress, selectedTrackId],
  );

  return (
    <View style={[localStyles.viewport, localStyles.trackList]}>
      <Text
        accessibilityRole="header"
        style={localStyles.heading}
      >
        Chapters
      </Text>
      <FlatList
        accessibilityLabel="Audiobook tracks"
        data={tracks}
        extraData={selectedTrackId}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={localStyles.viewport}
        contentContainerStyle={localStyles.content}
        ListEmptyComponent={<Text style={localStyles.empty}>No tracks in this audiobook.</Text>}
      />
    </View>
  );
};

export default TrackList;
