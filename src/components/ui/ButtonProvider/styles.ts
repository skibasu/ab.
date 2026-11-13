import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    button: {
      width: '100%',
      minHeight: theme.minHeight.button,
      padding: theme.spacing[3],
      borderRadius: theme.borderRadius.button,
      backgroundColor: theme.backgroundColor.control,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[3],
    },
    label: {
      ...theme.textStyles.button,
      width: theme.maxWidth.providerButtonLabel,
      flexShrink: 1,
      color: theme.textColor.primary,
      textAlign: 'center',
    },
    iconSlot: {
      width: theme.width.providerIcon,
      height: theme.height.providerIcon,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    icon: {
      width: theme.width.providerIcon,
      height: theme.height.providerIcon,
    },
    // Preserve the Apple SVG's native geometry inside the shared 20 × 20 slot.
    appleIcon: {
      width: 14,
      height: 18,
    },
    disabled: {
      backgroundColor: theme.backgroundColor.disabled,
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.75,
    },
  });
