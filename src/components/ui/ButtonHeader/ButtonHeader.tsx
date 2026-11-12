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
            style={stylesLocal.image}
            tintColor={theme.tintColor.primary}
          />
        </View>
      )}
    </Pressable>
  );
};
export default ButtonHeader;

// const styles = StyleSheet.create({
//   title: {
//     flex: 1,
//     fontSize: 28,
//     fontWeight: '700',
//   },

//   touchTarget: {
//     width: touchTarget,
//     height: touchTarget,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   button: {
//     width: 42,
//     height: 42,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });
