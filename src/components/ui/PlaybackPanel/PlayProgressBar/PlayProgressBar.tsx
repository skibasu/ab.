import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlayProgressBarProps = {
  progress: number;
};

const PlayProgressBar = ({ progress }: PlayProgressBarProps) => {
  const localStyles = styles(useAppTheme());
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <View
      accessible
      accessibilityLabel="Playback position"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={localStyles.seek}
    >
      <View style={localStyles.track} />
      <View style={[localStyles.thumb, { left: `${percentage}%` }]} />
    </View>
  );
};

export default PlayProgressBar;
