import { styles } from '@/components/global/Header/styles';
import Actions from '@/components/ui/Actions/Actions';
import HeaderTitle from '@/components/ui/HeaderTitle/HeaderTitle';
import type { IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AbHeaderProps = {
  title: string | null;
  iconList: IconName[];
};

const Header = ({ title, iconList }: AbHeaderProps) => {
  const theme = useAppTheme();
  const stylesLocal = styles(theme);
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={stylesLocal.container}
    >
      <View style={stylesLocal.row}>
        <HeaderTitle text={title} />
        <Actions iconList={iconList} />
      </View>
    </SafeAreaView>
  );
};
export default Header;
