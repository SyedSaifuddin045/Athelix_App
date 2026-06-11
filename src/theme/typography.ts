import { Platform } from "react-native";

export const FONTS = {
  family: Platform.select({
    ios: "System",
    android: "System",
    default: "System",
  }),
  condensed: Platform.select({
    ios: "System",
    android: "System",
    default: "System",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};

export const FONT_SIZES = {
  caption: 10,
  label: 11,
  bodySmall: 12,
  body: 13,
  bodyLarge: 14,
  button: 15,
  cardTitle: 15,
  sectionTitle: 17,
  screenTitle: 28,
  heroMetric: 20,
  bigMetric: 40,
  hugeMetric: 56,
};

export const FONT_WEIGHTS = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.5,
};
