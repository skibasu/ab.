import { useTheme } from '@/hooks/use-theme';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

const touchTarget = 44;

type HeaderButtonProps = {
  label: string;
  icon: number;
  iconSize: number;
  onPress?: () => void;
};

const HeaderButton = ({ label, icon, iconSize, onPress }: HeaderButtonProps) => {
  const theme = useTheme();
  const disabled = !onPress;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.touchTarget}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            { backgroundColor: theme.libraryHeaderControl, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Image
            accessible={false}
            source={icon}
            style={{ width: iconSize, height: iconSize }}
            tintColor={theme.libraryHeaderText}
          />
        </View>
      )}
    </Pressable>
  );
};
export default HeaderButton;

const styles = StyleSheet.create({
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },

  touchTarget: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
