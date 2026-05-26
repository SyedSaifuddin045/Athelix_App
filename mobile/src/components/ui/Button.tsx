import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";
import { shadow } from "../../utils/helpers";

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  style,
  subtle,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: object | object[];
  subtle?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        subtle
          ? { backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border, shadowOpacity: 0 }
          : shadow(COLORS.teal),
        disabled ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.primaryButtonText, subtle ? { color: "rgba(255,255,255,0.7)" } : null]}>{label}</Text>
    </Pressable>
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
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.roundButton,
        accent
          ? { backgroundColor: "rgba(0,212,168,0.16)", borderColor: "rgba(0,212,168,0.32)" }
          : null,
      ]}
    >
      {children}
    </Pressable>
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
            <Feather name="arrow-left" size={16} color={COLORS.text} />
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
