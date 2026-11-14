import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    surface: {
      width: '100%',
      backgroundColor: theme.backgroundColor.control,
      borderRadius: theme.borderRadius.control,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
      paddingHorizontal: theme.spacing[4] - 1,
      //  paddingVertical: theme.spacing[3] - 1,
      height: 48,
    },
    focusRing: {
      ...StyleSheet.absoluteFill,
      borderRadius: theme.borderRadius.control,
      borderWidth: theme.borderWidth.input,
      borderColor: theme.borderColor.focus,
    },
    searchIcon: {
      width: theme.width.icon,
      alignItems: 'center',
      flexShrink: 0,
    },
    searchGlyph: {
      width: 17,
      height: 17,
    },
    input: {
      ...theme.textStyles.input,
      flex: 1,
      minWidth: 0,
      height: theme.height.touchTarget,
      padding: 0,
      color: theme.textColor.primary,
      includeFontPadding: false,
      outlineStyle: 'solid',
      outlineWidth: 0,
    },
    inputWithClear: {
      marginRight: theme.spacing[8],
    },
    clearButton: {
      position: 'absolute',
      top: theme.spacing[0.5],
      right: theme.spacing[1],
      width: theme.width.touchTarget,
      height: theme.height.touchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearGlyph: {
      width: 14,
      height: 14,
    },
  });
