import type { ComponentPropsWithRef } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import Icon from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type AppButtonProps = Omit<ComponentPropsWithRef<typeof Pressable>, 'children'> & {
  label: string;
  icon?: IconName;
  loading?: boolean;
  loadingLabel?: string;
};

const AppButton = ({
  label,
  icon,
  loading = false,
  loadingLabel = label,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityState,
  ...props
}: AppButtonProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const isDisabled = Boolean(disabled || loading);
  const foreground = disabled ? theme.textColor.disabled : theme.textColor.onPrimary;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        localStyles.button,
        {
          backgroundColor: disabled
            ? theme.backgroundColor.disabled
            : state.pressed && !loading
              ? theme.backgroundColor.primaryPressed
              : theme.backgroundColor.primary,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessible={false}
          color={foreground}
          size="small"
          style={localStyles.spinner}
        />
      ) : icon ? (
        <Icon
          name={icon}
          color={foreground}
        />
      ) : null}
      <Text style={[localStyles.label, { color: foreground }]}>
        {loading ? loadingLabel : label}
      </Text>
    </Pressable>
  );
};

export default AppButton;
