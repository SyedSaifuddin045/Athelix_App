import { getVariableValue } from "@tamagui/core";
import { tokens } from "../../tamagui/tokens";

const { radius } = tokens;

export const radii = {
  button: getVariableValue(radius.button),
  card: getVariableValue(radius.card),
  cardSmall: getVariableValue(radius.cardSmall),
  input: getVariableValue(radius.input),
  chip: getVariableValue(radius.chip),
  iconWrap: getVariableValue(radius.iconWrap),
  avatar: getVariableValue(radius.avatar),
  sheet: getVariableValue(radius.sheet),
  tag: getVariableValue(radius.tag),
  round: getVariableValue(radius.round),
  stepper: getVariableValue(radius.stepper),
  modal: getVariableValue(radius.modal),
} as const;
