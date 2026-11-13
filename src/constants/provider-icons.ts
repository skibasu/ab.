export const providerIcons = {
  apple: require('@/assets/svg/apple.svg'),
  google: require('@/assets/svg/google.svg'),
  microsoft: require('@/assets/svg/microsoft.svg'),
} as const;

export type ProviderIconName = keyof typeof providerIcons;
