import { useAudioPlayerStatus } from 'expo-audio';
import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import type { BookPlayback } from '@/hooks/use-book-playback';
import type { LibraryTrack } from '@/services/book-repository';
import BackButton from './BackButton/BackButton';
import NextButton from './NextButton/NextButton';
import PlayButton from './PlayButton/PlayButton';
import PlayHeader from './PlayHeader/PlayHeader';
import PlayProgressBar from './PlayProgressBar/PlayProgressBar';
import PlaySpeed from './PlaySpeed/PlaySpeed';
import PlayTimer from './PlayTimer/PlayTimer';
import PlayTimes from './PlayTimes/PlayTimes';
import { styles } from './styles';

type PlaybackPanelProps = {
  track: LibraryTrack;
  playback: BookPlayback;
};

const PlaybackPanel = ({ track, playback }: PlaybackPanelProps) => {
  const { ready } = playback;
  const status = useAudioPlayerStatus(playback.player);
  const currentTime = ready ? status.currentTime : 0;
  const duration = ready && status.duration > 0 ? status.duration : track.duration;
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.panel}>
      <PlayHeader
        position={track.position}
        title={track.title}
      />
      <PlayProgressBar progress={duration && duration > 0 ? (currentTime / duration) * 100 : 0} />
      <PlayTimes
        currentTime={currentTime}
        duration={duration}
      />
      <View style={localStyles.controls}>
        <BackButton
          onPress={playback.back}
          disabled={!ready}
        />
        <PlayButton
          playing={status.playing}
          onPress={playback.togglePlay}
          disabled={!ready}
        />
        <NextButton
          onPress={playback.next}
          disabled={!ready}
        />
      </View>
      <View style={localStyles.options}>
        <PlaySpeed speed={1} />
        <PlayTimer />
      </View>
    </View>
  );
};

export default PlaybackPanel;
