import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import Icon from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { styles } from './styles';

export type FilterIcon = {
  iconName: IconName;
  width: number;
  height: number;
};

export type FilterProps = {
  icon?: FilterIcon;
  filterLabel: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const Filter = ({ icon, filterLabel, selected, onPress, style }: FilterProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={filterLabel}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[localStyles.option, selected && localStyles.selectedOption, style]}
    >
      {icon && (
        <Icon
          name={icon.iconName}
          width={icon.width}
          height={icon.height}
          color={selected ? theme.tintColor.onPrimary : theme.tintColor.primary}
        />
      )}
      <Text style={[localStyles.label, selected && localStyles.selectedLabel]}>{filterLabel}</Text>
    </Pressable>
  );
};

export default Filter;
