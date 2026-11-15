import { View } from 'react-native';

import Icon from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type IconBadgeProps = { icon: IconName; color?: string };

const IconBadge = ({ icon, color }: IconBadgeProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.container}>
      <View style={[localStyles.background, color ? { backgroundColor: color } : undefined]} />
      <Icon
        name={icon}
        width={58}
        height={58}
        color={color ?? theme.backgroundColor.primary}
      />
    </View>
  );
};

export default IconBadge;
