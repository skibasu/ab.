import { Text, View } from 'react-native';

import { formatTrackDuration } from '@/utils/format-track-duration';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlayTimesProps = {
  currentTime: number;
  duration: number | null;
};

const PlayTimes = ({ currentTime, duration }: PlayTimesProps) => {
  const localStyles = styles(useAppTheme());

  return (
    <View style={localStyles.times}>
      <Text style={localStyles.time}>{currentTime.toFixed(2)}</Text>
      <Text style={localStyles.time}>
        {duration === null ? '—' : `−${formatTrackDuration(duration)}`}
      </Text>
    </View>
  );
};

export default PlayTimes;
