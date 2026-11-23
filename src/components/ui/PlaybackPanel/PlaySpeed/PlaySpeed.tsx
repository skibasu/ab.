import { Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlaySpeedProps = {
  speed: number;
  onPress?: () => void;
  disabled?: boolean;
};

const PlaySpeed = ({ speed, onPress, disabled = true }: PlaySpeedProps) => {
  const localStyles = styles(useAppTheme());
  const label = speed.toFixed(1);

  return (
    <Pressable
      accessibilityLabel={`Playback speed, ${label} times`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={localStyles.optionTarget}
    >
      <View style={localStyles.option}>
        <Text style={localStyles.optionLabel}>{label}×</Text>
      </View>
    </Pressable>
  );
};

export default PlaySpeed;
