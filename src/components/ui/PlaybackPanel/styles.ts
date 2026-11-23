import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    panel: {
      backgroundColor: theme.backgroundColor.card,
      borderRadius: theme.borderRadius.card,
      paddingHorizontal: theme.spacing[4],
      paddingBottom: theme.spacing[2],
      gap: theme.spacing[1],
    },
    heading: { minHeight: theme.height.touchTarget, justifyContent: 'center' },
    title: { ...theme.textStyles.sectionHeading, color: theme.textColor.primary },
    seek: { height: theme.spacing[5], justifyContent: 'center' },
    track: { height: theme.spacing[1], backgroundColor: theme.backgroundColor.track },
    thumb: {
      position: 'absolute',
      left: 0,
      width: theme.spacing[3],
      height: theme.spacing[3],
      borderRadius: theme.spacing[1.5],
      backgroundColor: theme.tintColor.thumb,
    },
    times: { flexDirection: 'row', justifyContent: 'space-between' },
    time: {
      ...theme.textStyles.time,
      color: theme.textColor.secondary,
      fontVariant: ['tabular-nums'],
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      minHeight: 76,
    },
    skipButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    skipLabel: {
      ...theme.textStyles.time,
      color: theme.textColor.primary,
      position: 'absolute',
      top: 19,
      width: '100%',
      textAlign: 'center',
    },
    playButton: { width: 76, height: 76 },
    playIcon: { width: 76, height: 76 },
    options: { flexDirection: 'row', justifyContent: 'space-between' },
    optionTarget: { minHeight: theme.height.touchTarget, justifyContent: 'center' },
    option: {
      minHeight: 36,
      minWidth: 70,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[1.5],
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1.5],
      borderWidth: 1,
      borderColor: theme.borderColor.default,
      borderRadius: 18,
      backgroundColor: theme.backgroundColor.control,
    },
    optionLabel: { ...theme.textStyles.bookTile, color: theme.textColor.primary },
  });
