import { colors } from './colors';
import { textStyles, themeConfig } from './config';

/** A role always belongs to an explicit native styling purpose. */
const modeConfig = {
  light: {
    backgroundColor: {
      default: colors.white,
      screen: colors.violet[50],
      card: colors.violet[200],
      control: colors.violet[200],
      input: colors.violet[200],
      primary: colors.violet[400],
      primaryPressed: colors.indigo[400],
      secondary: colors.indigo[400],
      accent: colors.violet[250],
      disabled: colors.violet[200],
      track: colors.violet[300],
      fill: colors.violet[400],
    },
    textColor: {
      primary: colors.gray[750],
      secondary: colors.gray[500],
      onPrimary: colors.gray[800],
      onSecondary: colors.gray[800],
      onAccent: colors.gray[800],
      disabled: colors.gray[500],
      error: colors.red[700],
    },
    borderColor: {
      default: colors.violet[300],
      focus: colors.violet[700],
    },
    tintColor: {
      primary: colors.gray[750],
      secondary: colors.gray[500],
      onPrimary: colors.gray[800],
      thumb: colors.violet[700],
    },
    backgroundGradient: {
      screen: {
        colors: [colors.violet[50], colors.violet[150]],
        start: { x: 0.5, y: 0 },
        end: { x: 0.5, y: 1 },
      },
    },
  },
  dark: {
    backgroundColor: {
      default: colors.black,
      screen: colors.gray[850],
      card: colors.gray[650],
      control: colors.gray[700],
      input: colors.gray[700],
      primary: colors.violet[400],
      primaryPressed: colors.indigo[400],
      secondary: colors.indigo[400],
      accent: colors.violet[250],
      disabled: colors.gray[700],
      track: colors.gray[600],
      fill: colors.violet[400],
    },
    textColor: {
      primary: colors.violet[100],
      secondary: colors.gray[300],
      onPrimary: colors.gray[900],
      onSecondary: colors.gray[900],
      onAccent: colors.gray[900],
      disabled: colors.gray[300],
      error: colors.red[400],
    },
    borderColor: {
      default: colors.gray[600],
      focus: colors.violet[400],
    },
    tintColor: {
      primary: colors.violet[100],
      secondary: colors.gray[300],
      onPrimary: colors.gray[900],
      thumb: colors.violet[100],
    },
    backgroundGradient: {
      screen: {
        colors: [colors.gray[850], colors.gray[950]],
        start: { x: 0.5, y: 0 },
        end: { x: 0.5, y: 1 },
      },
    },
  },
} as const;

export type ThemeMode = keyof typeof modeConfig;
export type ThemePreference = ThemeMode | 'system';

function createTheme(mode: ThemeMode) {
  return { ...themeConfig, ...modeConfig[mode], mode, dark: mode === 'dark', textStyles };
}

export const themes = {
  light: createTheme('light'),
  dark: createTheme('dark'),
} as const;

export type AppTheme = (typeof themes)[ThemeMode];
export type BackgroundColorName = keyof AppTheme['backgroundColor'];
export type TextColorName = keyof AppTheme['textColor'];
export type BorderColorName = keyof AppTheme['borderColor'];
export type TintColorName = keyof AppTheme['tintColor'];

export function getTheme(scheme?: ThemeMode | null): AppTheme {
  return themes[scheme === 'dark' ? 'dark' : 'light'];
}
