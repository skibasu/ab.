import { Pressable, Text } from 'react-native';

import Icon from '@/components/ui/Icon/Icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type NextButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

const NextButton = ({ onPress, disabled = false }: NextButtonProps) => {
  const localStyles = styles(useAppTheme());

  return (
    <Pressable
      accessibilityLabel="Forward 15 seconds"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={localStyles.skipButton}
    >
      <Icon
        name="playerForward15"
        width={38}
        height={38}
      />
      <Text style={localStyles.skipLabel}>15</Text>
    </Pressable>
  );
};

export default NextButton;
