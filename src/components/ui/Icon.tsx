import * as Lucide from "lucide-react-native";
import { View } from "react-native";

import { COLORS } from "../../theme/colors";

function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part) => {
      if (!part) return "";
      if (/^\d/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export type IconName = string;

export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: object;
}) {
  const resolvedName = toPascalCase(name as string) as keyof typeof Lucide;
  const LucideIcon = Lucide[resolvedName] as
    | React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
    | undefined;

  if (!LucideIcon) return null;

  const iconElement = <LucideIcon size={size} color={color ?? COLORS.text} strokeWidth={strokeWidth} />;
  if (style) {
    return <View style={style}>{iconElement}</View>;
  }
  return iconElement;
}
