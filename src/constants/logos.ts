/** Original SVG exports from the Figma Logo ab. component. */
export const logos = {
  full: {
    source: require('@/assets/svg/logo-full.svg'),
    width: 132,
    height: 137,
  },
  medium: {
    source: require('@/assets/svg/logo-medium.svg'),
    width: 80,
    height: 83,
  },
  small: {
    source: require('@/assets/svg/logo-small.svg'),
    width: 40,
    height: 42,
  },
  minimal: {
    source: require('@/assets/svg/logo-minimal.svg'),
    width: 65,
    height: 37,
  },
} as const;

export type LogoVariant = keyof typeof logos;
