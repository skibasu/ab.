import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import Icon from '@/components/ui/icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles';

type SearchInputProps = {
  value: string;
  onChangeText: (value: string) => void;
};

const SearchInput = ({ value, onChangeText }: SearchInputProps) => {
  const theme = useAppTheme();
  const localStyles = styles(theme);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <View style={localStyles.surface}>
      {isFocused && (
        <View
          pointerEvents="none"
          style={localStyles.focusRing}
        />
      )}
      <View style={localStyles.row}>
        <View style={localStyles.searchIcon}>
          <Icon
            name="searchInput"
            width={localStyles.searchGlyph.width}
            height={localStyles.searchGlyph.height}
            color={theme.tintColor.secondary}
          />
        </View>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search library"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          placeholder="Search by title or author"
          placeholderTextColor={
            isFocused ? `${theme.textColor.secondary}A6` : theme.textColor.secondary
          }
          selectionColor={theme.borderColor.focus}
          underlineColorAndroid="transparent"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[localStyles.input, hasValue && localStyles.inputWithClear]}
        />
      </View>
      {hasValue && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => {
            onChangeText('');
            inputRef.current?.focus();
          }}
          style={localStyles.clearButton}
        >
          <Icon
            name="clear"
            width={localStyles.clearGlyph.width}
            height={localStyles.clearGlyph.height}
            color={theme.tintColor.secondary}
          />
        </Pressable>
      )}
    </View>
  );
};

export default SearchInput;
