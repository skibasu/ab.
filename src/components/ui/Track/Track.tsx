import { memo } from 'react';
import { Pressable, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryTrack } from '@/services/book-repository';
import { formatTrackDuration } from '@/utils/format-track-duration';
import { styles } from './styles';

export type TrackProps = {
  track: LibraryTrack;
  number: number;
  selected?: boolean;
  onPress?: (track: LibraryTrack) => void;
};

const Track = ({ track, number, selected = false, onPress }: TrackProps) => {
  const localStyles = styles(useAppTheme());

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={() => onPress?.(track)}
      style={({ pressed }) => [
        localStyles.row,
        selected && localStyles.selected,
        pressed && localStyles.pressed,
      ]}
    >
      <Text style={[localStyles.number, selected && localStyles.selectedNumber]}>
        {String(number).padStart(2, '0')}
      </Text>
      <Text style={[localStyles.title]}>{track.title}</Text>
      <Text style={localStyles.duration}>{formatTrackDuration(track.duration)}</Text>
    </Pressable>
  );
};

export default memo(Track);
