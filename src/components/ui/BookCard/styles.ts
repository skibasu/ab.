import { StyleSheet } from 'react-native';

import type { AppTheme } from '@/theme';

export const styles = (theme: AppTheme) =>
  StyleSheet.create({
    card: { flexGrow: 0 },
    minimal: { width: '100%' },
    full: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[4],
      paddingHorizontal: theme.spacing[6],
      paddingVertical: theme.spacing[4],
    },
    pressed: { opacity: 0.75 },
    coverFrame: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: theme.borderRadius.control,
      overflow: 'hidden',
    },
    fullCoverFrame: {
      width: 84,
      height: 100,
      aspectRatio: undefined,
      borderRadius: theme.borderRadius.xl,
      flexShrink: 0,
    },
    cover: StyleSheet.absoluteFill,
    minimalDetails: { paddingVertical: theme.spacing[2] },
    fullDetails: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
    title: { ...theme.textStyles.bookTile, color: theme.textColor.primary },
    fullTitle: { ...theme.textStyles.sectionHeading, color: theme.textColor.primary },
    author: { ...theme.textStyles.metadata, color: theme.textColor.secondary },
    metadata: { ...theme.textStyles.metadata, color: theme.textColor.secondary },
    progress: { ...theme.textStyles.caption, color: theme.textColor.secondary },
  });
