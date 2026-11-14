import { Image } from 'expo-image';

import { icons, type IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconProps = {
  name: IconName;
  width?: number;
  height?: number;
  color?: string;
};

export default function Icon({ name, width, height, color }: IconProps) {
  const theme = useAppTheme();
  const iconWidth = width ?? theme.width.icon;
  const iconHeight = height ?? theme.height.icon;

  return (
    <Image
      accessible={false}
      source={icons[name]}
      contentFit="contain"
      style={{ width: iconWidth, height: iconHeight }}
      tintColor={color ?? theme.tintColor.primary}
    />
  );
}
