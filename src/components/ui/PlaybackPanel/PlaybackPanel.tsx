import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon/Icon';
import { icons } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { LibraryTrack } from '@/services/book-repository';
import { formatTrackDuration } from '@/utils/format-track-duration';
import { styles } from './styles';

type PlaybackPanelProps = {
  track: LibraryTrack;
};

/** Presentation only. Audio controls remain disabled until playback is implemented. */
const PlaybackPanel = ({ track }: PlaybackPanelProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.panel}>
      <View style={localStyles.heading}>
        <Text style={localStyles.number}>{String(track.position + 1).padStart(2, '0')}</Text>
        <Text style={localStyles.title}>{track.title}</Text>
      </View>
      <View
        accessible
        accessibilityLabel="Playback position"
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: 0 }}
        style={localStyles.seek}
      >
        <View style={localStyles.track} />
        <View style={localStyles.thumb} />
      </View>
      <View style={localStyles.times}>
        <Text style={localStyles.time}>0:00</Text>
        <Text style={localStyles.time}>
          {track.duration === null ? '—' : `−${formatTrackDuration(track.duration)}`}
        </Text>
      </View>
      <View style={localStyles.controls}>
        <Pressable
          accessibilityLabel="Back 15 seconds"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={localStyles.skipButton}
        >
          <Icon
            name="playerBack15"
            width={38}
            height={38}
          />
          <Text style={localStyles.skipLabel}>15</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Play"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={localStyles.playButton}
        >
          <Image
            source={icons.playerPlay}
            style={localStyles.playIcon}
            accessible={false}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Forward 15 seconds"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={localStyles.skipButton}
        >
          <Icon
            name="playerForward15"
            width={38}
            height={38}
          />
          <Text style={localStyles.skipLabel}>15</Text>
        </Pressable>
      </View>
      <View style={localStyles.options}>
        <Pressable
          accessibilityLabel="Playback speed, 1.0 times"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={localStyles.optionTarget}
        >
          <View style={localStyles.option}>
            <Text style={localStyles.optionLabel}>1.0×</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Sleep timer"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={localStyles.optionTarget}
        >
          <View style={localStyles.option}>
            <Icon
              name="sleep"
              width={12}
              height={12}
            />
            <Text style={localStyles.optionLabel}>Sleep timer</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default PlaybackPanel;
