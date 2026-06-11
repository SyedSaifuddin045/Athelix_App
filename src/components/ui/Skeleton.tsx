import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

import { COLORS } from "../../theme/colors";
import { RADIUS } from "../../theme/spacing";

export function Skeleton({
  width,
  height,
  radius = RADIUS.cardSmall,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? "100%",
          height: height ?? 20,
          borderRadius: radius,
          backgroundColor: COLORS.cardSoft,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: object }) {
  return (
    <View style={[{ padding: 16, gap: 12 }, style]}>
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} width="90%" />
      <Skeleton height={12} width="75%" />
    </View>
  );
}

export function SkeletonRow({ style }: { style?: object }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, style]}>
      <Skeleton width={40} height={40} radius={14} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton height={13} width="50%" />
        <Skeleton height={10} width="30%" />
      </View>
    </View>
  );
}
