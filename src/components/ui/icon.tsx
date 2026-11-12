import { Image } from 'expo-image';

import { icons, type IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export default function Icon({ name, size, color }: IconProps) {
  const theme = useAppTheme();
  const iconSize = size ?? theme.width.icon;

  return (
    <Image
      accessible={false}
      source={icons[name]}
      contentFit="contain"
      style={{ width: iconSize, height: iconSize }}
      tintColor={color ?? theme.tintColor.primary}
    />
  );
}
