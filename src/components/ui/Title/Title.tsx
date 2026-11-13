import type { ComponentPropsWithRef } from 'react';
import { Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type TitleProps = Omit<ComponentPropsWithRef<typeof Text>, 'children'> & {
  text: string;
};

const Title = ({ text, style, ...props }: TitleProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <Text
      {...props}
      style={[localStyles.title, style]}
    >
      {text}
    </Text>
  );
};

export default Title;
