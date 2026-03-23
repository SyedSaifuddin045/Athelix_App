import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";

interface ListCardProps {
  icon?: React.ReactNode;
  iconEmoji?: string;
  name: string;
  color: string;
  badge?: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showPlayButton?: boolean;
  compact?: boolean;
}

export function ListCard({ icon, iconEmoji, name, color, badge, subtitle, onPress, rightElement, showPlayButton = true, compact = false }: ListCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, compact && styles.compactContainer, pressed && styles.pressed]}>
      {!compact && <View style={[styles.leftBar, { backgroundColor: color }]} />}
      <View style={styles.content}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        {iconEmoji && <Text style={[styles.emoji, compact && styles.compactEmoji]}>{iconEmoji}</Text>}
        <View style={styles.textContent}>
          <Text style={[styles.name, { color }, compact && styles.compactName]}>{name}</Text>
          {subtitle && !compact && <Text style={styles.subtitle}>{subtitle}</Text>}
          {badge && !compact && <Text style={[styles.badge, { color }]}>{badge}</Text>}
        </View>
      </View>
      {rightElement || (showPlayButton && onPress && !compact && (
        <View style={[styles.playButton, { backgroundColor: color }]}>
          <Feather name="play" size={14} color="#000000" />
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    minHeight: 72,
  },
  compactContainer: {
    width: 140,
    minHeight: 80,
    marginRight: 10,
    marginBottom: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: 12,
  },
  pressed: { opacity: 0.7 },
  leftBar: { width: 4 },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrap: { marginRight: 12 },
  emoji: { fontSize: 28, marginRight: 12 },
  compactEmoji: { fontSize: 24, marginRight: 0, marginBottom: 8 },
  textContent: { flex: 1 },
  compactName: { fontSize: 13 },
  name: { fontSize: 15, fontWeight: "700" },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
