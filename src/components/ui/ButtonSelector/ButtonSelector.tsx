import type { ComponentPropsWithRef } from 'react';
import { Pressable, Text } from 'react-native';

import Icon from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type ButtonSelectorProps = Omit<ComponentPropsWithRef<typeof Pressable>, 'children'> & {
  label: string;
  icon?: IconName;
  hasArrow?: boolean;
};

export default function ButtonSelector({
  label,
  icon,
  hasArrow = false,
  disabled = false,
  accessibilityLabel,
  accessibilityState,
  style,
  ...props
}: ButtonSelectorProps) {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const foreground = disabled ? theme.textColor.disabled : theme.textColor.primary;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      style={(state) => [
        localStyles.button,
        state.pressed && localStyles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          width={21}
          height={21}
          color={foreground}
        />
      )}
      <Text style={[localStyles.label, { color: foreground }]}>{label}</Text>
      {hasArrow && (
        <Icon
          name="chevronRight"
          width={16}
          height={16}
          color={disabled ? theme.textColor.disabled : theme.tintColor.secondary}
        />
      )}
    </Pressable>
  );
}
