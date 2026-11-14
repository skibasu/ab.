import { View } from 'react-native';

import Icon from '@/components/ui/icon';
import Subtitle from '@/components/ui/Subtitle/Subtitle';
import Title from '@/components/ui/Title/Title';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type InfoPanelProps = {
  icon: IconName;
  title: string;
  message: string;
};

const InfoPanel = ({ icon, title, message }: InfoPanelProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const iconSize = theme.spacing[7];

  return (
    <View style={localStyles.container}>
      <Icon
        name={icon}
        width={iconSize}
        height={iconSize}
        color={theme.tintColor.secondary}
      />
      <Title
        accessibilityRole="header"
        text={title}
        style={localStyles.title}
      />
      <Subtitle
        text={message}
        style={localStyles.message}
      />
    </View>
  );
};

export default InfoPanel;
