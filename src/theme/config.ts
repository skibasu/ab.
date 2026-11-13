import type { TextStyle } from 'react-native';

import { colors } from './colors';

/** Native units; one spacing step is 4, as in Tailwind. */
const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  4.25: 17,
  4.75: 19,
  5: 20,
  5.5: 22,
  6: 24,
  7: 28,
  8: 32,
  10.5: 42,
  11: 44,
  12: 48,
  13.75: 55,
  16: 64,
  56: 224,
  85.5: 342,
} as const;

const fontFamily = { sans: 'Inter' } as const;
const fontWeight = { medium: '500', semibold: '600', bold: '700' } as const;

/** Custom size values preserve the current design; these are not Tailwind defaults. */
const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 13,
  base: 16,
  lg: 17,
  '2xl': 27,
  '3xl': 28,
  '4xl': 36,
} as const;

export const themeConfig = {
  colors,
  spacing,
  borderRadius: {
    lg: spacing[2],
    xl: spacing[3],
    button: spacing[4.25],
    control: 14,
    card: spacing[4.75],
    artwork: spacing[5.5],
  },
  borderWidth: { input: spacing[0.5] },
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight: { 6: spacing[6] },
  letterSpacing: { normal: 0 },
  width: {
    icon: spacing[4.25],
    providerIcon: spacing[5],
    iconButton: spacing[10.5],
    touchTarget: spacing[11],
  },
  height: {
    icon: spacing[4.25],
    providerIcon: spacing[5],
    iconButton: spacing[10.5],
    touchTarget: spacing[11],
  },
  minHeight: {
    button: spacing[13.75],
    input: spacing[13.75],
    credentialInput: spacing[11],
  },
  maxWidth: { content: spacing[85.5], buttonLabel: spacing[56], providerButtonLabel: 222 },
} as const;

function textStyle<Size extends number, Weight extends TextStyle['fontWeight']>(
  size: Size,
  weight: Weight,
) {
  return {
    fontFamily: fontFamily.sans,
    fontSize: size,
    fontWeight: weight,
    letterSpacing: themeConfig.letterSpacing.normal,
  };
}

/** Reusable text styles; omit lineHeight when native font metrics should apply. */
export const textStyles = {
  pageTitle: textStyle(fontSize['4xl'], fontWeight.bold),
  sectionHeading: textStyle(fontSize.lg, fontWeight.semibold),
  bookTitle: textStyle(fontSize.lg, fontWeight.bold),
  playerTitle: textStyle(fontSize['2xl'], fontWeight.bold),
  bookTile: textStyle(fontSize.sm, fontWeight.semibold),
  metadata: textStyle(fontSize.xs, fontWeight.medium),
  link: textStyle(fontSize.xs, fontWeight.semibold),
  caption: textStyle(fontSize['2xs'], fontWeight.medium),
  button: textStyle(fontSize.lg, fontWeight.bold),
  time: textStyle(fontSize.xs, fontWeight.medium),
  input: {
    ...textStyle(fontSize.base, fontWeight.medium),
    lineHeight: themeConfig.lineHeight[6],
  },
  headerTitle: textStyle(fontSize['3xl'], fontWeight.bold),
} as const satisfies Record<string, TextStyle>;
