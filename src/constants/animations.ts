import { Easing, ReduceMotion } from 'react-native-reanimated';

export const ACCORDION_ANIMATION_CONFIG = {
  duration: 250,
  easing: Easing.inOut(Easing.quad),
  reduceMotion: ReduceMotion.System,
};
