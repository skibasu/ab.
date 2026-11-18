import { View } from 'react-native';
import type { ReactNode } from 'react';

import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import { styles } from './styles';

export type ActionsProps = {
  iconList: IconName[];
  trailingAction?: ReactNode;
};

const Actions = ({ iconList, trailingAction }: ActionsProps) => {
  const router = useRouter();
  const theme = useAppTheme();
  const localStyles = styles(theme);

  if (iconList.length === 0 && !trailingAction) return null;

  return (
    <View style={localStyles.actions}>
      {iconList.map((icon) => (
        <ButtonHeader
          key={icon}
          icon={icon}
          label={icon}
          onPress={() => {
            if (icon === 'search') router.push('/search');
            else if (icon === 'settings') router.push('/settings');
            else if (icon === 'close') router.back();
          }}
        />
      ))}
      {trailingAction}
    </View>
  );
};

export default Actions;
