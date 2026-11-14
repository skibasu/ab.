import { IconName, icons } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { styles } from './styles';

type ButtonHeaderProps = {
  label: string;
  icon: IconName;

  onPress?: () => void;
};

const ButtonHeader = ({ label, icon, onPress }: ButtonHeaderProps) => {
  const theme = useAppTheme();
  const stylesLocal = styles(theme);
  const isDisabled = !onPress;
  const sizes: [number, number] = [0, 0];
  if (icon === 'close') {
    sizes[0] = 14;
    sizes[1] = 14;
  }
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={stylesLocal.touchTarget}
    >
      {({ pressed }) => (
        <View style={[stylesLocal.body, { opacity: pressed ? 0.75 : 1 }]}>
          <Image
            accessible={false}
            source={icons[icon]}
            style={[
              stylesLocal.image,
              sizes[0] && sizes[1] ? { width: sizes[0], height: sizes[1] } : {},
            ]}
            tintColor={theme.tintColor.primary}
          />
        </View>
      )}
    </Pressable>
  );
};
export default ButtonHeader;
