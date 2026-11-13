import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      ...theme.textStyles.metadata,
      color: theme.textColor.primary,
      marginBottom: theme.spacing[1.5],
    },
    surface: {
      width: '100%',
      minHeight: theme.minHeight.credentialInput,
      backgroundColor: theme.backgroundColor.input,
      borderRadius: theme.borderRadius.control,
      borderWidth: theme.borderWidth.input,
      padding: theme.spacing[3] - theme.borderWidth.input,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      ...theme.textStyles.input,
      flex: 1,
      minWidth: 0,
      padding: 0,
      color: theme.textColor.primary,
      includeFontPadding: false,
    },
    disabledLabel: {
      color: theme.textColor.secondary,
      opacity: 0.7,
    },
    disabledSurface: {
      backgroundColor: theme.backgroundColor.disabled,
    },
    disabledInput: {
      color: theme.textColor.secondary,
      opacity: 0.55,
    },
    errorSlot: {
      marginTop: theme.spacing[1.5],
    },
    error: {
      ...theme.textStyles.metadata,
      color: theme.textColor.error,
      includeFontPadding: false,
    },
  });
