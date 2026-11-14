import Filter from '@/components/ui/Filter/Filter';
import Icon from '@/components/ui/icon';
import { type IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { styles } from './styles';

const EXPANDED_HEIGHT = 250;

type AccordionProps = {
  title: string;
  iconName: IconName;
};

const Accordion = ({ title, iconName }: AccordionProps) => {
  const theme = useAppTheme();
  const stylesLocal = styles(theme);
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = useDerivedValue(() =>
    withTiming(isExpanded ? 1 : 0, {
      duration: 250,
      easing: Easing.inOut(Easing.quad),
      reduceMotion: ReduceMotion.System,
    }),
  );
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    height: progress.get() * EXPANDED_HEIGHT,
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));

  return (
    <View style={stylesLocal.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => setIsExpanded((expanded) => !expanded)}
        style={({ pressed }) => [stylesLocal.container, pressed && stylesLocal.pressed]}
      >
        <View style={stylesLocal.wrapper}>
          <Icon
            name={iconName}
            width={stylesLocal.image.width}
            height={stylesLocal.image.height}
          />
          <Text style={stylesLocal.title}>{title}</Text>
        </View>
        <Animated.View style={arrowAnimatedStyle}>
          <Icon
            name="arrowDown"
            width={stylesLocal.arrow.width}
            height={stylesLocal.arrow.height}
          />
        </Animated.View>
      </Pressable>
      <Animated.View
        pointerEvents={isExpanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!isExpanded}
        importantForAccessibility={isExpanded ? 'auto' : 'no-hide-descendants'}
        style={[stylesLocal.content, { flexDirection: 'row', gap: 12 }, contentAnimatedStyle]}
      >
        <Filter
          label="Filter 1"
          selected={true}
          onPress={() => console.log('Filter 1 pressed')}
        />
        <Filter
          label="Filter 2"
          selected={false}
          onPress={() => console.log('Filter 2 pressed')}
        />
        <Filter
          label="Filter 3"
          selected={false}
          onPress={() => console.log('Filter 3 pressed')}
        />
      </Animated.View>
      <View
        pointerEvents="none"
        style={stylesLocal.border}
      />
    </View>
  );
};

export default Accordion;
