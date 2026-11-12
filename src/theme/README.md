# Native theme configuration

For iOS and Android. The structure follows [Tailwind theme namespaces](https://tailwindcss.com/docs/theme) and its [shared color palette](https://tailwindcss.com/docs/colors). This is a typed React Native configuration; it does not install Tailwind, NativeWind, CSS classes or a CSS runtime.

Tailwind uses one color palette and expresses purpose through utilities such as `bg-violet-400`, `text-violet-400` and `border-violet-400`. The native equivalent here is one `colors` palette plus explicit `backgroundColor`, `textColor`, `borderColor` and `tintColor` sections. These purpose sections are the app's native adapter, not a claim that Tailwind v4 requires separate color palettes for each utility.

## Files

- `colors.ts`: the only definitions of the shared palette's color values.
- `config.ts`: `themeConfig`, with colors, numeric spacing, border radius, font family, font weight, font size, line height and dimensions. `textStyles` composes those primitives into reusable native Text styles.
- `theme.ts`: Light/Dark role assignments. Each value refers directly to `colors`, without an intermediate Figma-shaped object.
- `index.ts`: public exports. Import configuration and types from `@/theme`; components get the active theme through `useAppTheme()`.

## Palette versus purpose

```ts
import { themeConfig } from '@/theme';

// Fixed colors: the name tells you the color family and shade.
themeConfig.colors.violet[400];
themeConfig.colors.gray[700];

// Shared scale: spacing step × 4 native units.
themeConfig.spacing[4]; // 16

themeConfig.borderRadius.control; // 14
themeConfig.fontFamily.sans; // Inter
themeConfig.fontWeight.semibold; // '600'
themeConfig.fontSize.base; // 16
```

The palette contains the application's custom values, not Tailwind's exact stock palette. Existing values and intermediate shades such as `violet[150]` and `gray[650]` are preserved. The font-size scale is also customized: for example `lg` is 17 and `3xl` is 28. Numeric dimensions are density-independent React Native values, not rem or physical pixels.

## Apply colors by purpose

```tsx
import { Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

function BookCard() {
  const theme = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: theme.backgroundColor.card,
        borderColor: theme.borderColor.default,
        borderWidth: 1,
        borderRadius: theme.borderRadius.card,
        padding: theme.spacing[4],
      }}
    >
      <Text style={[theme.textStyles.bookTitle, { color: theme.textColor.primary }]}>
        Audiobook title
      </Text>
    </View>
  );
}
```

| Purpose                    | Examples                                                                    |
| -------------------------- | --------------------------------------------------------------------------- |
| Fixed palette shade        | `theme.colors.violet[400]`, `theme.colors.gray[700]`                        |
| Background fill            | `theme.backgroundColor.screen`, `.card`, `.input`, `.control`               |
| Action backgrounds         | `theme.backgroundColor.primary`, `.primaryPressed`, `.secondary`, `.accent` |
| Disabled background        | `theme.backgroundColor.disabled`                                            |
| Progress/slider background | `theme.backgroundColor.track`, `.fill`                                      |
| Text                       | `theme.textColor.primary`, `.secondary`, `.disabled`                        |
| Text on colored actions    | `theme.textColor.onPrimary`, `.onSecondary`, `.onAccent`                    |
| Border                     | `theme.borderColor.default`, `.focus`                                       |
| Icons or slider thumb      | `theme.tintColor.primary`, `.secondary`, `.thumb`                           |
| Screen gradient            | `theme.backgroundGradient.screen`                                           |

A name such as `card` only appears inside a purpose section. `backgroundColor.card` is a background fill; text on that card uses `textColor.primary`, and its border uses `borderColor.default`. The palette does not contain component-specific names such as `card`, `foreground` or `progressTrack`.

## Light and Dark

`useAppTheme()` follows the phone's appearance. `useAppTheme('light')` or `useAppTheme('dark')` selects a per-call preference. `getTheme('dark')` and `themes.light` also work outside React; an unavailable system scheme falls back to Light. All modes expose the same keys. These helpers do not persist a global user preference.

Change a shared shade in `colors.ts` to update every referencing role. Change its assignment in `theme.ts` to adjust one role or one mode. No component styles need to be rewritten for either change.

## Text and dimensions

- `textStyles` references the font-family/size/weight configuration instead of repeating numeric values. The 11 existing text roles preserve their metrics; names such as `playerTitle`, `caption`, `button` and `input` describe intended use.
- Inter must be registered before applying the new text styles. Existing components retain their system fonts. Native font scaling remains enabled.
- Omitted line height uses the font's native metrics. The input text style explicitly uses `lineHeight[6]` (24).
- `width.iconButton` and `height.iconButton` are 42; `width.touchTarget` and `height.touchTarget` are 44. `minHeight.button` and `.input` are 55. `maxWidth.buttonLabel` is 224; `maxWidth.content` is 342.
- `backgroundGradient.screen` contains colors and normalized start/end coordinates. It has no Figma matrix or logo gradient. Logo gradients belong to the imported SVG. A descriptor alone does not paint a component.

## Figma

The existing design values originate in [Design System v1](https://www.figma.com/design/0xjivSija0SRgPEyXM14mQ/ab.?node-id=41-53), but native code names now follow the configuration above. The code no longer exports `designColors`, `designGradients` or the old `tokens` wrapper. Figma variable/documentation names can be aligned in the next design pass; this refactor does not edit the Figma file.
