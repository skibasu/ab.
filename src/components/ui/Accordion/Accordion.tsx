import Icon from '@/components/ui/icon';
import { ACCORDION_ANIMATION_CONFIG } from '@/constants/animations';
import { type IconName } from '@/constants/icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { styles } from './styles';

type AccordionProps = {
  title: string;
  iconName: IconName;
  children: ReactNode;
};

const Accordion = ({ title, iconName, children }: AccordionProps) => {
  const theme = useAppTheme();
  const stylesLocal = styles(theme);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedTarget = useRef(false);
  const measuredHeight = useRef(0);
  const contentHeight = useSharedValue(0);
  const progress = useSharedValue(0);
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    height: progress.get() * contentHeight.get(),
  }));
  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.get() * 180}deg` }],
  }));

  const updateExpandedState = (expanded: boolean) => {
    if (expandedTarget.current === expanded) setIsExpanded(expanded);
  };

  const handlePress = () => {
    const nextExpanded = !expandedTarget.current;
    expandedTarget.current = nextExpanded;

    // Keep React commits outside the transition; both visual changes share one animation.
    progress.set(
      withTiming(nextExpanded ? 1 : 0, ACCORDION_ANIMATION_CONFIG, (finished) => {
        if (finished) scheduleOnRN(updateExpandedState, nextExpanded);
      }),
    );
  };

  return (
    <View style={stylesLocal.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isExpanded }}
        onPress={handlePress}
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
        style={[stylesLocal.content, contentAnimatedStyle]}
      >
        <View
          collapsable={false}
          style={stylesLocal.contentMeasure}
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (measuredHeight.current !== nextHeight) {
              measuredHeight.current = nextHeight;
              contentHeight.set(nextHeight);
            }
          }}
        >
          {children}
        </View>
      </Animated.View>
      <View
        pointerEvents="none"
        style={stylesLocal.border}
      />
    </View>
  );
};

export default Accordion;
