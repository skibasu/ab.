import { View } from 'react-native';

import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { styles } from './styles';

export type ActionsProps = {
  iconList: IconName[];
};

const Actions = ({ iconList }: ActionsProps) => {
  const router = useRouter();
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
          onPress={() => (icon === 'search' ? router.push('/search') : console.log('pressed'))}
        />
      ))}
    </View>
  );
};

export default Actions;
