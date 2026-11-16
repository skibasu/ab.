import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import type { AppLinkProps } from '@/components/ui/AppLink/AppLink';
import { styles as linkStyles } from '@/components/ui/AppLink/styles';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type ActionLinkProps = AppLinkProps & {
  children?: ReactNode;
};

const ActionLink = ({
  href,
  replace,
  push,
  dismissTo,
  text,
  children,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityState,
  hitSlop = 12,
  ...props
}: ActionLinkProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const localLinkStyles = linkStyles(theme);

  const content = (
    <Pressable
      {...props}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      style={style}
    >
      {({ pressed }) => (
        <Text
          accessible={false}
          style={localStyles.content}
        >
          <Text
            style={[
              localLinkStyles.text,
              textStyle,
              pressed && localLinkStyles.pressed,
              disabled && localLinkStyles.disabled,
            ]}
          >
            {text}
          </Text>
          {children}
        </Text>
      )}
    </Pressable>
  );

  if (disabled) return content;

  return (
    <Link
      href={href}
      replace={replace}
      push={push}
      dismissTo={dismissTo}
      asChild
    >
      {content}
    </Link>
  );
};

export default ActionLink;
