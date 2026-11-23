import type { ComponentPropsWithRef } from 'react';
import { ActivityIndicator, Pressable, Text, type StyleProp, type TextStyle } from 'react-native';

import Icon from '@/components/ui/Icon/Icon';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type AppButtonProps = Omit<ComponentPropsWithRef<typeof Pressable>, 'children'> & {
  label: string;
  variant?: 'primary' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  loadingLabel?: string;
  labelStyle?: StyleProp<TextStyle>;
};

const AppButton = ({
  label,
  variant = 'primary',
  icon,
  loading = false,
  loadingLabel = label,
  labelStyle,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityState,
  ...props
}: AppButtonProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const isDisabled = Boolean(disabled || loading);
  const foregroundStyle = disabled ? localStyles.disabledLabel : localStyles[`${variant}Label`];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        localStyles.button,
        localStyles[variant],
        state.pressed && !isDisabled && localStyles[`${variant}Pressed`],
        disabled && localStyles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessible={false}
          color={foregroundStyle.color}
          size="small"
          style={localStyles.spinner}
        />
      ) : icon ? (
        <Icon
          name={icon}
          color={foregroundStyle.color}
        />
      ) : null}
      <Text style={[localStyles.label, foregroundStyle, labelStyle]}>
        {loading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
};

export default AppButton;
