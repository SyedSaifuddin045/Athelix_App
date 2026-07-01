import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useTheme } from "@tamagui/core";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";
import { AppIcon, type IconName } from "../../design-system/icons/AppIcon";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: object | object[];
}

function useScalePress() {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return { animatedStyle, onPressIn, onPressOut };
}

function getVariantStyle(variant: ButtonVariant, theme: ReturnType<typeof useTheme>, disabled?: boolean) {
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const bgSoft = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const red = theme.colorRed?.get() ?? "#EF4444";
  const bgRed = theme.colorRedDark?.get() ?? "rgba(239,68,68,0.12)";

  switch (variant) {
    case "primary":
      return {
        backgroundColor: accent,
        borderWidth: 0,
        textColor: "#000000",
        shadowColor: accent,
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      };
    case "secondary":
      return {
        backgroundColor: bgSoft,
        borderWidth: 1,
        borderColor,
        textColor,
        shadowOpacity: 0,
        elevation: 0,
      };
    case "destructive":
      return {
        backgroundColor: bgRed,
        borderWidth: 1,
        borderColor: red + "40",
        textColor: red,
        shadowOpacity: 0,
        elevation: 0,
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        borderWidth: 0,
        textColor: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
        shadowOpacity: 0,
        elevation: 0,
      };
  }
}

function getSizeStyle(size: ButtonSize) {
  switch (size) {
    case "sm":
      return { minHeight: 36, paddingHorizontal: 14, gap: spacing.sm };
    case "md":
      return { minHeight: 44, paddingHorizontal: 18, gap: spacing.md };
    case "lg":
      return { minHeight: 56, paddingHorizontal: 22, gap: spacing.lg };
  }
}

function getIconSize(size: ButtonSize) {
  switch (size) {
    case "sm": return 14;
    case "md": return 18;
    case "lg": return 20;
  }
}

function getLabelSize(size: ButtonSize) {
  switch (size) {
    case "sm": return 13;
    case "md": return 14;
    case "lg": return 15;
  }
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  loading,
  disabled,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();
  const variantStyle = getVariantStyle(variant, theme, disabled);
  const sizeStyle = getSizeStyle(size);

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          borderRadius: radii.button,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          opacity: disabled || loading ? 0.5 : 1,
          ...variantStyle,
          ...sizeStyle,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#000000" : variantStyle.textColor} />
      ) : icon ? (
        <AppIcon name={icon} size={getIconSize(size)} color={variantStyle.textColor} />
      ) : null}
      <Text
        style={{
          color: variantStyle.textColor,
          fontSize: getLabelSize(size),
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
