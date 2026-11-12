import { styles } from '@/components/global/Header/styles';
import ButtonHeader from '@/components/ui/ButtonHeader/ButtonHeader';
import ScreenTitle from '@/components/ui/ScreenTitle/ScreenTitle';
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
        <ScreenTitle title={title} />
        {iconList.length > 0 && (
          <View style={stylesLocal.actions}>
            {iconList.map((icon) => (
              <ButtonHeader
                key={icon}
                icon={icon}
                label={icon}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
export default Header;
