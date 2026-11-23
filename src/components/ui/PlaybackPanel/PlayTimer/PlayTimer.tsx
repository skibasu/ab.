import { Pressable, Text, View } from 'react-native';

import Icon from '@/components/ui/Icon/Icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlayTimerProps = {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
};

const PlayTimer = ({ label = 'Sleep timer', onPress, disabled = true }: PlayTimerProps) => {
  const localStyles = styles(useAppTheme());

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={localStyles.optionTarget}
    >
      <View style={localStyles.option}>
        <Icon
          name="sleep"
          width={12}
          height={12}
        />
        <Text style={localStyles.optionLabel}>{label}</Text>
      </View>
    </Pressable>
  );
};

export default PlayTimer;
