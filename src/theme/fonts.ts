import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import type { FontFamilyDefinition } from 'expo-font';

import { themeConfig } from './config';

/** Bundled locally; register all theme weights together under the Inter family. */
export const fontFamilies: FontFamilyDefinition[] = [
  {
    fontFamily: themeConfig.fontFamily.sans,
    fontDefinitions: [
      { path: Inter_500Medium, weight: themeConfig.fontWeight.medium, style: 'normal' },
      { path: Inter_600SemiBold, weight: themeConfig.fontWeight.semibold, style: 'normal' },
      { path: Inter_700Bold, weight: themeConfig.fontWeight.bold, style: 'normal' },
    ],
  },
];
