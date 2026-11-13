import { Link, type LinkProps } from 'expo-router';
import type { ComponentPropsWithRef } from 'react';
import { Pressable, Text, type StyleProp, type TextStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type AppLinkProps = Omit<ComponentPropsWithRef<typeof Pressable>, 'children'> &
  Pick<LinkProps, 'href' | 'replace' | 'push' | 'dismissTo'> & {
    text: string;
    textStyle?: StyleProp<TextStyle>;
  };

const AppLink = ({
  href,
  replace,
  push,
  dismissTo,
  text,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityState,
  ...props
}: AppLinkProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  const content = (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      style={(state) => [localStyles.container, typeof style === 'function' ? style(state) : style]}
    >
      {({ pressed }) => (
        <Text
          accessible={false}
          style={[
            localStyles.text,
            textStyle,
            pressed && localStyles.pressed,
            disabled && localStyles.disabled,
          ]}
        >
          {text}
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

export default AppLink;
