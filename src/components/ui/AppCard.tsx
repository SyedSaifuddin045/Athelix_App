import { View, type ViewStyle } from "react-native";
import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";

const ACCENT_BORDER: Record<string, string> = {
  none: "transparent",
  green: "greenDark",
  purple: "purpleDark",
  blue: "blueDark",
  red: "redDark",
  coral: "accent",
  gold: "gold",
};

const ACCENT_BG: Record<string, string> = {
  none: "transparent",
  green: "greenDark",
  purple: "purpleDark",
  blue: "blueDark",
  red: "redDark",
};

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  accent?: keyof typeof ACCENT_BORDER | "none";
  accentColor?: string;
}

export function AppCard({ children, style, elevated, accent, accentColor }: AppCardProps) {
  const theme = useTheme();

  const borderColor =
    accent && accent in ACCENT_BORDER
      ? theme[ACCENT_BORDER[accent] as keyof typeof theme]?.toString() ?? theme.borderColor?.toString()
      : theme.borderColor?.toString();

  const bgColor =
    accent && accent in ACCENT_BG
      ? theme[ACCENT_BG[accent] as keyof typeof theme]?.toString() ?? theme.surface3?.toString()
      : theme.surface1?.toString();

  const leftAccentStyle: ViewStyle | null = accentColor
    ? { borderLeftWidth: 3, borderLeftColor: accentColor }
    : null;

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor,
          borderRadius: radii.card,
          paddingHorizontal: spacing.xl3,
          paddingVertical: spacing.xl3,
        },
        elevated
          ? {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }
          : null,
        leftAccentStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
