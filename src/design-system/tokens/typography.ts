import { getVariableValue } from "@tamagui/core";
import { tokens } from "../../tamagui/tokens";
import { fontHeading } from "../../tamagui/fonts";

const { size: fontSize } = fontHeading;

export const fontSizes = {
  caption: getVariableValue(fontSize.caption),
  label: getVariableValue(fontSize.label),
  bodySmall: getVariableValue(fontSize.bodySmall),
  body: getVariableValue(fontSize.body),
  bodyLarge: getVariableValue(fontSize.bodyLarge),
  button: getVariableValue(fontSize.button),
  cardTitle: getVariableValue(fontSize.cardTitle),
  sectionTitle: getVariableValue(fontSize.sectionTitle),
  screenTitle: getVariableValue(fontSize.screenTitle),
  heroMetric: getVariableValue(fontSize.heroMetric),
  bigMetric: getVariableValue(fontSize.bigMetric),
  hugeMetric: getVariableValue(fontSize.hugeMetric),
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
} as const;

export const lineHeights = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.5,
} as const;
