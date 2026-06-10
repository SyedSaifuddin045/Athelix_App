import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { getApiErrorMessage } from "../../api/client";
import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object | object[];
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <Card style={{ alignItems: "center", gap: 10, marginTop: 18 }}>
      <ActivityIndicator color={COLORS.teal} />
      <Text style={styles.detailLabel}>{label}</Text>
    </Card>
  );
}

export function ErrorCard({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card style={{ marginTop: 18, borderColor: "rgba(239,68,68,0.24)", backgroundColor: "rgba(239,68,68,0.08)" }}>
      <Text style={[styles.listRowTitle, { color: COLORS.red }]}>Could not load data</Text>
      <Text style={[styles.detailLabel, { marginTop: 6 }]}>{getApiErrorMessage(error)}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={[styles.smallAccentButton, { alignSelf: "flex-start", marginTop: 12 }]}>
          <Feather name="refresh-cw" size={13} color={COLORS.teal} />
          <Text style={styles.smallAccentText}>Retry</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>-</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}
