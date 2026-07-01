import { View, type ViewStyle } from "react-native";
import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";
import { AnimatedEnter } from "../../design-system/layout/AnimatedEnter";

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
  animate?: boolean;
  animationDelay?: number;
}

export function AppCard({ children, style, elevated, accent, accentColor, animate, animationDelay }: AppCardProps) {
  const theme = useTheme();

  const borderColor =
    accent && accent in ACCENT_BORDER
      ? theme[ACCENT_BORDER[accent] as keyof typeof theme]?.toString() ?? theme.borderColor?.get()
      : theme.borderColor?.get();

  const bgColor =
    accent && accent in ACCENT_BG
      ? theme[ACCENT_BG[accent] as keyof typeof theme]?.toString() ?? theme.surface3?.get()
      : theme.surface1?.get();

  const leftAccentStyle: ViewStyle | null = accentColor
    ? { borderLeftWidth: 3, borderLeftColor: accentColor }
    : null;

  const card = (
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

  if (animate) {
    return <AnimatedEnter type="fadeUp" delay={animationDelay ?? 0}>{card}</AnimatedEnter>;
  }

  return card;
}
