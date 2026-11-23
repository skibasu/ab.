import { styles } from '@/components/global/Header/styles';
import Actions from '@/components/ui/Actions/Actions';
import HeaderTitle from '@/components/ui/HeaderTitle/HeaderTitle';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AbHeaderProps = {
  title: string | null;
  iconList: IconName[];
  transparent?: boolean;
  trailingAction?: ReactNode;
};

const Header = ({ title, iconList, transparent = false, trailingAction }: AbHeaderProps) => {
  const theme = useAppTheme();
  const stylesLocal = styles(theme);
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={!transparent && stylesLocal.container}
    >
      <View style={stylesLocal.row}>
        <HeaderTitle text={title} />
        <Actions
          iconList={iconList}
          trailingAction={trailingAction}
        />
      </View>
    </SafeAreaView>
  );
};
export default Header;
