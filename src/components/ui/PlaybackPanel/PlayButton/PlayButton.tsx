import { Image } from 'expo-image';
import { Pressable } from 'react-native';

import { icons } from '@/constants/icons';
import { styles } from './styles';

type PlayButtonProps = {
  playing: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const PlayButton = ({ playing, onPress, disabled = false }: PlayButtonProps) => {
  const localStyles = styles();

  return (
    <Pressable
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={localStyles.playButton}
    >
      <Image
        source={playing ? icons.playerPause : icons.playerPlay}
        style={localStyles.playIcon}
        accessible={false}
      />
    </Pressable>
  );
};

export default PlayButton;
