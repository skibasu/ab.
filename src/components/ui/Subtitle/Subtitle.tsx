import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type SubtitleProps = Omit<ComponentPropsWithRef<typeof Text>, 'children'> &
  ({ text: string; children?: never } | { text?: never; children: ReactNode });

const Subtitle = ({ text, children, style, ...props }: SubtitleProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <Text
      {...props}
      style={[localStyles.subtitle, style]}
    >
      {text ?? children}
    </Text>
  );
};

export default Subtitle;
