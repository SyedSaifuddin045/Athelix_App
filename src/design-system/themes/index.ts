import { useTheme } from "@tamagui/core";

export function useAppTheme() {
  return useTheme();
}

export function useSemanticColor(name: keyof ReturnType<typeof useTheme>) {
  const theme = useTheme();
  return theme[name];
}

export type ThemeColors = {
  accent: string;
  textColor: string;
  mutedColor: string;
  faintColor: string;
  borderColor: string;
  surface: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surfaceHover: string;
  redColor: string;
  redDarkColor: string;
  greenColor: string;
  greenDarkColor: string;
  goldColor: string;
  orangeColor: string;
  purpleColor: string;
  purpleDarkColor: string;
  blueColor: string;
  blueDarkColor: string;
  screenColor: string;
};

const DEFAULTS = {
  accent: "#FF5A36",
  textColor: "#FFFFFF",
  mutedColor: "rgba(255,255,255,0.45)",
  faintColor: "rgba(255,255,255,0.25)",
  borderColor: "rgba(255,255,255,0.08)",
  surface: "#0D0D0D",
  surface1: "rgba(255,255,255,0.04)",
  surface2: "rgba(255,255,255,0.06)",
  surface3: "rgba(255,255,255,0.07)",
  surfaceHover: "rgba(255,255,255,0.06)",
  redColor: "#EF4444",
  redDarkColor: "rgba(239,68,68,0.12)",
  greenColor: "#22C55E",
  greenDarkColor: "rgba(34,197,94,0.12)",
  goldColor: "#FBBF24",
  orangeColor: "#F59E0B",
  purpleColor: "#8B5CF6",
  purpleDarkColor: "rgba(139,92,246,0.12)",
  blueColor: "#3B82F6",
  blueDarkColor: "rgba(59,130,246,0.12)",
  screenColor: "#0A0A0A",
};

export function useThemeColors(): ThemeColors {
  const theme = useTheme();
  return {
    accent: theme.accent?.get() ?? DEFAULTS.accent,
    textColor: theme.color?.get() ?? DEFAULTS.textColor,
    mutedColor: theme.colorMuted?.get() ?? DEFAULTS.mutedColor,
    faintColor: theme.colorFaint?.get() ?? DEFAULTS.faintColor,
    borderColor: theme.borderColor?.get() ?? DEFAULTS.borderColor,
    surface: theme.surface?.get() ?? DEFAULTS.surface,
    surface1: theme.surface1?.get() ?? DEFAULTS.surface1,
    surface2: theme.surface2?.get() ?? DEFAULTS.surface2,
    surface3: theme.surface3?.get() ?? DEFAULTS.surface3,
    surfaceHover: theme.surfaceHover?.get() ?? DEFAULTS.surfaceHover,
    redColor: theme.colorRed?.get() ?? DEFAULTS.redColor,
    redDarkColor: theme.colorRedDark?.get() ?? DEFAULTS.redDarkColor,
    greenColor: theme.colorGreen?.get() ?? DEFAULTS.greenColor,
    greenDarkColor: theme.colorGreenDark?.get() ?? DEFAULTS.greenDarkColor,
    goldColor: theme.colorGold?.get() ?? DEFAULTS.goldColor,
    orangeColor: theme.colorOrange?.get() ?? DEFAULTS.orangeColor,
    purpleColor: theme.colorPurple?.get() ?? DEFAULTS.purpleColor,
    purpleDarkColor: theme.colorPurpleDark?.get() ?? DEFAULTS.purpleDarkColor,
    blueColor: theme.colorBlue?.get() ?? DEFAULTS.blueColor,
    blueDarkColor: theme.colorBlueDark?.get() ?? DEFAULTS.blueDarkColor,
    screenColor: theme.backgroundFocus?.get() ?? DEFAULTS.screenColor,
  };
}
