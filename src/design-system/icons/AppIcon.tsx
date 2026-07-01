import * as Lucide from "lucide-react-native";
import { View } from "react-native";
import { useTheme } from "@tamagui/core";

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => {
      if (!part) return "";
      if (/^\d/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export type IconName = string;

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
}

export function AppIcon({ name, size = 20, color, strokeWidth = 2, style }: AppIconProps) {
  const theme = useTheme();
  const resolvedName = toPascalCase(name) as keyof typeof Lucide;
  const LucideIcon = Lucide[resolvedName] as
    | React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
    | undefined;

  if (!LucideIcon) return null;

  const resolvedColor = color ?? theme.color?.get();
  const iconElement = <LucideIcon size={size} color={resolvedColor} strokeWidth={strokeWidth} />;

  if (style) {
    return <View style={style}>{iconElement}</View>;
  }
  return iconElement;
}
