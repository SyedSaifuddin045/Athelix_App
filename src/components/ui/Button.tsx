import { ActivityIndicator, Pressable, Text, View } from "react-native";
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

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  subtle,
  loading,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: object | object[];
  subtle?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  const accent = theme.accent?.toString() ?? "#FF5A36";
  const bgSoft = theme.surface2?.toString() ?? "rgba(255,255,255,0.06)";
  const borderCol = theme.borderColor?.toString() ?? "rgba(255,255,255,0.08)";

  const bgColor = subtle ? bgSoft : accent;
  const textColor = subtle
    ? (theme.color?.toString() ?? "#FFFFFF")
    : "#000000";

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          minHeight: 56,
          borderRadius: radii.button,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          backgroundColor: bgColor,
          borderWidth: subtle ? 1 : 0,
          borderColor: subtle ? borderCol : "transparent",
          opacity: disabled || loading ? 0.5 : 1,
          ...(subtle
            ? { shadowOpacity: 0, elevation: 0 }
            : {
                shadowColor: accent,
                shadowOpacity: 0.28,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }),
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={subtle ? theme.colorMuted?.toString() : "#000000"} />
      ) : (
        icon
      )}
      <Text
        style={{
          color: textColor,
          fontSize: 15,
          fontWeight: "800",
          opacity: subtle ? 0.7 : 1,
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function RoundButton({
  children,
  onPress,
  accent,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accent?: boolean;
}) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accent
            ? "rgba(255,90,54,0.16)"
            : (theme.surface2?.toString() ?? "rgba(255,255,255,0.07)"),
          borderWidth: 1,
          borderColor: accent
            ? "rgba(255,90,54,0.32)"
            : (theme.borderColor?.toString() ?? "rgba(255,255,255,0.09)"),
        },
        animatedStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  color,
  backgroundColor,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();
  const btnSize = size;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        {
          width: btnSize,
          height: btnSize,
          borderRadius: btnSize / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: backgroundColor ?? theme.surface2?.toString(),
          borderWidth: 1,
          borderColor: theme.borderColor?.toString(),
        },
        animatedStyle,
      ]}
    >
      <AppIcon name={icon} size={btnSize * 0.45} color={color ?? theme.color?.toString()} />
    </AnimatedPressable>
  );
}

export function BackHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        {onBack ? (
          <RoundButton onPress={onBack}>
            <AppIcon name="arrow-left" size={16} color={theme.color?.toString()} />
          </RoundButton>
        ) : null}
        <View>
          <Text
            style={{
              color: theme.color?.toString() ?? "#FFFFFF",
              fontSize: 17,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: theme.colorMuted?.toString() ?? "rgba(255,255,255,0.45)",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View>{right}</View> : <View style={{ width: 36 }} />}
    </View>
  );
}
