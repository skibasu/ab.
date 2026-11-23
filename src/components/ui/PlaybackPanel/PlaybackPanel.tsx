import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
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
};

const PlaybackPanel = ({ track }: PlaybackPanelProps) => {
  const audioSource = {
    uri: new File(Paths.document, track.filePath).uri,
  };
  const player = useAudioPlayer(audioSource);
  const status = useAudioPlayerStatus(player);
  const togglePlay = () => (player.playing ? player.pause() : player.play());
  const next = async () => await player.seekTo(Math.min(player.duration, player.currentTime + 15));
  const back = async () => await player.seekTo(Math.max(0, player.currentTime - 15));

  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.panel}>
      <PlayHeader
        position={track.position}
        title={track.title}
      />
      <PlayProgressBar progress={0} />
      <PlayTimes
        currentTime={status.currentTime}
        duration={track.duration}
      />
      <View style={localStyles.controls}>
        <BackButton onPress={back} />
        <PlayButton
          playing={status.playing}
          onPress={togglePlay}
        />
        <NextButton onPress={next} />
      </View>
      <View style={localStyles.options}>
        <PlaySpeed speed={1} />
        <PlayTimer />
      </View>
    </View>
  );
};

export default PlaybackPanel;
