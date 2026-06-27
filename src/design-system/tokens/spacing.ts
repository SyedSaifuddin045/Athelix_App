import { getVariableValue } from "@tamagui/core";
import { tokens } from "../../tamagui/tokens";

const { size } = tokens;

export const spacing = {
  xxs: getVariableValue(size.xxs),
  xs: getVariableValue(size.xs),
  sm: getVariableValue(size.sm),
  md: getVariableValue(size.md),
  lg: getVariableValue(size.lg),
  xl: getVariableValue(size.xl),
  xl2: getVariableValue(size.xl2),
  xl3: getVariableValue(size.xl3),
  xl4: getVariableValue(size.xl4),
  xl5: getVariableValue(size.xl5),
  xl6: getVariableValue(size.xl6),
  xl7: getVariableValue(size.xl7),
  xl8: getVariableValue(size.xl8),
  xl9: getVariableValue(size.xl9),
  xl10: getVariableValue(size.xl10),
} as const;
