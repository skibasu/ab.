import { memo, useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const circumference = 2 * Math.PI * 25;
export type BookProgressBarLoaderProps = { progress: number };

const BookProgressBarLoader = ({ progress }: BookProgressBarLoaderProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const value = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  const animatedProgress = useSharedValue(value);
  const opacity = useSharedValue(1);
  useEffect(() => {
    animatedProgress.set(withTiming(value, { duration: 280 }));
  }, [value, animatedProgress]);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(0.7, { duration: 900 }), -1, true));
    return () => {
      opacity.set(1);
    };
  }, [opacity]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.get() / 100),
  }));
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      style={[localStyles.container, animatedStyle]}
      accessibilityRole="progressbar"
      accessibilityLabel="Import progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
    >
      <Svg
        width={60}
        height={60}
        style={localStyles.ring}
        accessible={false}
      >
        <Circle
          cx={30}
          cy={30}
          r={25}
          fill="none"
          stroke={theme.backgroundColor.track}
          strokeWidth={4}
        />
        <AnimatedCircle
          cx={30}
          cy={30}
          r={25}
          fill="none"
          stroke={theme.backgroundColor.primary}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={[circumference, circumference]}
          rotation={-90}
          origin="30,30"
          animatedProps={animatedProps}
        />
      </Svg>
      <Text
        style={localStyles.label}
        accessible={false}
      >
        {Math.round(value)}%
      </Text>
    </Animated.View>
  );
};
export default memo(BookProgressBarLoader);
