import { Image } from 'expo-image';
import type { ComponentPropsWithRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { providerIcons, type ProviderIconName } from '@/constants/provider-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type ButtonProviderProps = Omit<ComponentPropsWithRef<typeof Pressable>, 'children'> & {
  label: string;
  icon: ProviderIconName;
  loading?: boolean;
  loadingLabel?: string;
};

const ButtonProvider = ({
  label,
  icon,
  loading = false,
  loadingLabel = 'Signing in…',
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityState,
  ...props
}: ButtonProviderProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        localStyles.button,
        disabled && localStyles.disabled,
        state.pressed && !isDisabled && localStyles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <View style={localStyles.iconSlot}>
        {loading ? (
          <ActivityIndicator
            accessible={false}
            color={theme.textColor.secondary}
            size="small"
          />
        ) : (
          <Image
            accessible={false}
            source={providerIcons[icon]}
            contentFit="contain"
            style={icon === 'apple' ? localStyles.appleIcon : localStyles.icon}
            tintColor={icon === 'apple' ? theme.textColor.primary : undefined}
          />
        )}
      </View>
      <Text style={localStyles.label}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
};

export default ButtonProvider;
