import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { icons } from '@/constants/icons';
import { styles } from './styles';

type PlayButtonProps = {
  playing: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const PlayButton = ({ playing, onPress, disabled = false }: PlayButtonProps) => {
  const localStyles = styles();
  const pressProgress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressProgress.get() * 0.2,
    transform: [{ scale: 1 - pressProgress.get() * 0.05 }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    pressProgress.set(withTiming(1, { duration: 100, reduceMotion: ReduceMotion.System }));
  };

  const handlePressOut = () => {
    pressProgress.set(withTiming(0, { duration: 160, reduceMotion: ReduceMotion.System }));
  };

  return (
    <Pressable
      accessibilityLabel={playing ? 'Pause' : 'Play'}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={localStyles.playButton}
    >
      <Animated.View style={animatedStyle}>
        <Image
          source={playing ? icons.playerPause : icons.playerPlay}
          style={localStyles.playIcon}
          accessible={false}
        />
      </Animated.View>
    </Pressable>
  );
};

export default PlayButton;
