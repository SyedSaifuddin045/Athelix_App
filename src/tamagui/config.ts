import { createTamagui } from "@tamagui/core";
import { createAnimations } from "@tamagui/animations-react-native";
import { shorthands } from "@tamagui/shorthands";

import { tokens } from "./tokens";
import { fontHeading, fontBody } from "./fonts";
import { darkTheme } from "./themes";

const media = {
  xl: { maxWidth: 1650 },
  lg: { maxWidth: 1280 },
  md: { maxWidth: 1020 },
  sm: { maxWidth: 800 },
  xs: { maxWidth: 660 },
  xxs: { maxWidth: 390 },
  gtXs: { minWidth: 661 },
  gtSm: { minWidth: 801 },
  gtMd: { minWidth: 1021 },
  gtLg: { minWidth: 1281 },
  gtXl: { minWidth: 1651 },
};

const mediaQueryDefaultActive = {
  xl: true,
  lg: true,
  md: true,
  sm: true,
  xs: true,
  xxs: false,
};

export const animations = createAnimations({
  fast: {
    damping: 20,
    mass: 0.8,
    stiffness: 300,
  },
  medium: {
    damping: 15,
    mass: 1,
    stiffness: 200,
  },
  slow: {
    damping: 10,
    mass: 1.5,
    stiffness: 100,
  },
});

export const config = createTamagui({
  animations,
  name: "mobile",
  shorthands,
  media,
  tokens,
  fonts: {
    heading: fontHeading,
    body: fontBody,
  },
  themes: {
    dark: darkTheme,
  },
  selectionStyles: (theme) =>
    theme.color5
      ? {
          backgroundColor: theme.color5,
          color: theme.color11,
        }
      : null,
  settings: {
    defaultFont: "body",
    shouldAddPrefersColorThemes: true,
    disableSSR: true,
    mediaQueryDefaultActive,
  },
});

export type AppConfig = typeof config;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}
