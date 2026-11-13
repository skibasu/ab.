import { useState, type ComponentPropsWithRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

export type AppInputProps = ComponentPropsWithRef<typeof TextInput> & {
  label?: string;
  errorMessage?: string;
  error?: boolean;
  withError?: boolean;
};

const AppInput = ({
  label,
  withError = true,
  errorMessage,
  error = false,
  editable = true,
  readOnly = false,
  style,
  placeholderTextColor,
  selectionColor,
  underlineColorAndroid = 'transparent',
  accessibilityLabel,
  accessibilityState,
  onFocus,
  onBlur,
  ...props
}: AppInputProps) => {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const localStyles = styles(theme);
  const isDisabled = !editable || readOnly;
  const hasError = error || Boolean(errorMessage);
  const borderColor = isDisabled
    ? 'transparent'
    : hasError
      ? theme.borderColor.error
      : isFocused
        ? theme.borderColor.focus
        : 'transparent';

  return (
    <View style={localStyles.container}>
      {label && (
        <Text style={[localStyles.label, isDisabled && localStyles.disabledLabel]}>{label}</Text>
      )}
      <View
        style={[localStyles.surface, isDisabled && localStyles.disabledSurface, { borderColor }]}
      >
        <TextInput
          {...props}
          editable={editable}
          readOnly={readOnly}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
          placeholderTextColor={placeholderTextColor ?? theme.textColor.secondary}
          selectionColor={selectionColor ?? theme.borderColor.focus}
          underlineColorAndroid={underlineColorAndroid}
          style={[localStyles.input, isDisabled && localStyles.disabledInput, style]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />
      </View>
      {withError && (
        <View style={localStyles.errorSlot}>
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
      )}
    </View>
  );
};

export default AppInput;
