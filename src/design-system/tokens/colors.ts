import { getVariableValue } from "@tamagui/core";
import { tokens } from "../../tamagui/tokens";

const { color } = tokens;

export const rawColors = {
  root: getVariableValue(color.root),
  screen: getVariableValue(color.screen),
  text: getVariableValue(color.text),
  muted: getVariableValue(color.muted),
  faint: getVariableValue(color.faint),
  border: getVariableValue(color.border),
  borderLight: getVariableValue(color.borderLight),
  card: getVariableValue(color.card),
  cardSoft: getVariableValue(color.cardSoft),
  cardElevated: getVariableValue(color.cardElevated),
  accent: getVariableValue(color.accent),
  coral: getVariableValue(color.coral),
  teal: getVariableValue(color.teal),
  green: getVariableValue(color.green),
  greenDark: getVariableValue(color.greenDark),
  gold: getVariableValue(color.gold),
  orange: getVariableValue(color.orange),
  red: getVariableValue(color.red),
  redDark: getVariableValue(color.redDark),
  purple: getVariableValue(color.purple),
  purpleDark: getVariableValue(color.purpleDark),
  blue: getVariableValue(color.blue),
  blueDark: getVariableValue(color.blueDark),
  surface: getVariableValue(color.surface),
  surfaceLight: getVariableValue(color.surfaceLight),
  tabBar: getVariableValue(color.tabBar),
} as const;
