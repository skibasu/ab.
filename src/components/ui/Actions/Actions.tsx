import { View } from 'react-native';

import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type ActionsProps = {
  iconList: IconName[];
};

const Actions = ({ iconList }: ActionsProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);

  if (iconList.length === 0) return null;

  return (
    <View style={localStyles.actions}>
      {iconList.map((icon) => (
        <ButtonHeader
          key={icon}
          icon={icon}
          label={icon}
          onPress={() => console.log('pressed')}
        />
      ))}
    </View>
  );
};

export default Actions;
