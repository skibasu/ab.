import type { ComponentPropsWithRef } from 'react';
import { Text, TextInput, View, useWindowDimensions } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type AppInputProps = ComponentPropsWithRef<typeof TextInput> & {
  label: string;
  errorMessage?: string;
};

const AppInput = ({ label, errorMessage, ...props }: AppInputProps) => {
  const theme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const localStyles = styles(theme);

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
      />
      <View style={[localStyles.errorSlot, { height: theme.lineHeight[6] * 2 * fontScale }]}>
        {errorMessage && (
          <Text
            accessible={Boolean(errorMessage)}
            accessibilityLabel={errorMessage}
            accessibilityLiveRegion="polite"
            numberOfLines={2}
            ellipsizeMode="tail"
            style={localStyles.error}
          >
            {errorMessage ?? ''}
          </Text>
        )}
      </View>
    </View>
  );
};

export default AppInput;
