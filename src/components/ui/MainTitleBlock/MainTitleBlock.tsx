import { View } from 'react-native';

import Subtitle from '@/components/ui/Subtitle/Subtitle';
import Title from '@/components/ui/Title/Title';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type MainTitleBlockProps = {
  title: string;
  subtitle: string;
};

const MainTitleBlock = ({ title, subtitle }: MainTitleBlockProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.container}>
      <Title text={title} />
      <Subtitle text={subtitle} />
    </View>
  );
};

export default MainTitleBlock;
