import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RoundButton } from "./RoundButton";
import { COLORS } from "../../theme/colors";

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function BackHeader({ title, subtitle, onBack, right }: BackHeaderProps): React.JSX.Element {
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

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  headerSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
});
