import { useAppTheme } from '@/hooks/use-app-theme';
import { Text } from 'react-native';
import { styles } from './styles';

type HeaderTitleProps = {
  text: string | null;
};

const HeaderTitle = ({ text }: HeaderTitleProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  return text ? <Text style={localStyles.title}>{text}</Text> : null;
};

export default HeaderTitle;
