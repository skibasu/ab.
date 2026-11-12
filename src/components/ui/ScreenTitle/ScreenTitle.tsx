import { useAppTheme } from '@/hooks/use-app-theme';
import { Text } from 'react-native';
import { styles } from './styles';

type MainTitleProps = {
  title: string | null;
};

const ScreenTitle = ({ title }: MainTitleProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return title ? <Text style={localStyles.title}>{title}</Text> : null;
};

export default ScreenTitle;
