import { useTheme } from "@tamagui/core";

export function useAppTheme() {
  return useTheme();
}

export function useSemanticColor(name: keyof ReturnType<typeof useTheme>) {
  const theme = useTheme();
  return theme[name];
}
