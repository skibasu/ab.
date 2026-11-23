import { Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type PlayHeaderProps = {
  position: number;
  title: string;
};

const PlayHeader = ({ position, title }: PlayHeaderProps) => {
  const localStyles = styles(useAppTheme());

  return (
    <View style={localStyles.heading}>
      <Text style={localStyles.number}>{String(position + 1).padStart(2, '0')}</Text>
      <Text style={localStyles.title}>{title}</Text>
    </View>
  );
};

export default PlayHeader;
