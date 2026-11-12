import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AbHeaderProps = {
  left: React.ReactNode;
  right: React.ReactNode;
};

const ThemedHeader = ({ left, right }: AbHeaderProps) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: theme.background }}
    >
      <View style={styles.row}>
        {left}
        <View style={styles.actions}>{right}</View>
      </View>
    </SafeAreaView>
  );
};
export default ThemedHeader;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 11,
    paddingHorizontal: Spacing.four,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
