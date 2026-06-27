import { createTamagui } from "@tamagui/core";
import { config as baseConfig } from "@tamagui/config";

import { tokens } from "./tokens";
import { fontHeading, fontBody } from "./fonts";
import { darkTheme } from "./themes";

export const tamaguiConfig = createTamagui({
  ...baseConfig,
  tokens,
  fonts: {
    heading: fontHeading,
    body: fontBody,
  },
  themes: {
    dark: darkTheme,
  },
  settings: {
    ...baseConfig.settings,
    disableSSR: true,
    mediaQueryDefaultActive: {
      base: true,
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppConfig {}
}
