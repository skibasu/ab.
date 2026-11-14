import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type FilterProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const Filter = ({ label, selected, onPress, style }: FilterProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[localStyles.option, selected && localStyles.selectedOption, style]}
    >
      <Text style={[localStyles.label, selected && localStyles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
};

export default Filter;
