import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

import { COLORS } from "../../theme/colors";
import { RADIUS, SPACING, SHADOWS } from "../../theme/spacing";
import { styles } from "../../theme/styles";
import { Icon, type IconName } from "./Icon";

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
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.primaryButton,
        subtle
          ? {
              backgroundColor: COLORS.cardSoft,
              borderWidth: 1,
              borderColor: COLORS.border,
              shadowOpacity: 0,
            }
          : SHADOWS.glow(COLORS.teal),
        disabled || loading ? { opacity: 0.5 } : null,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={subtle ? COLORS.muted : "#000000"} />
      ) : (
        icon
      )}
      <Text
        style={[
          styles.primaryButtonText,
          subtle ? { color: COLORS.text, opacity: 0.7 } : null,
        ]}
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
  const { animatedStyle, onPressIn, onPressOut } = useScalePress();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.roundButton,
        animatedStyle,
        accent
          ? {
              backgroundColor: "rgba(255,90,54,0.16)",
              borderColor: "rgba(255,90,54,0.32)",
            }
          : null,
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
          backgroundColor: backgroundColor ?? COLORS.cardSoft,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        animatedStyle,
      ]}
    >
      <Icon name={icon} size={btnSize * 0.45} color={color ?? COLORS.text} />
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
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        {onBack ? (
          <RoundButton onPress={onBack}>
            <Icon name="arrow-left" size={16} color={COLORS.text} />
          </RoundButton>
        ) : null}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : <View style={{ width: 36 }} />}
    </View>
  );
}
