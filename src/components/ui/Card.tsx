import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from "react-native";

import { getApiErrorMessage } from "../../api/client";
import { COLORS } from "../../theme/colors";
import { RADIUS, SPACING, SHADOWS } from "../../theme/spacing";
import { styles } from "../../theme/styles";
import { Icon } from "./Icon";

const ACCENT_BORDER: Record<string, string> = {
  none: "transparent",
  green: COLORS.greenDark,
  purple: COLORS.purpleDark,
  blue: COLORS.blueDark,
  red: COLORS.redDark,
  coral: "rgba(255,90,54,0.15)",
  gold: "rgba(251,191,36,0.12)",
};

const ACCENT_BG: Record<string, string> = {
  none: "transparent",
  green: COLORS.greenDark,
  purple: COLORS.purpleDark,
  blue: COLORS.blueDark,
  red: COLORS.redDark,
};

export function Card({
  children,
  style,
  elevated,
  accent,
  accentColor,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  accent?: keyof typeof ACCENT_BORDER | "none";
  accentColor?: string;
}) {
  const borderColor = accent && accent in ACCENT_BORDER ? ACCENT_BORDER[accent] : COLORS.border;
  const bgColor = accent && accent in ACCENT_BG ? ACCENT_BG[accent] : COLORS.card;
  const leftAccentStyle: ViewStyle | null = accentColor
    ? { borderLeftWidth: 3, borderLeftColor: accentColor }
    : null;

  return (
    <View
      style={[
        styles.card,
        elevated ? SHADOWS.md : null,
        { borderColor, backgroundColor: bgColor },
        leftAccentStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <Card elevated style={{ alignItems: "center", gap: SPACING.lg, marginTop: SPACING.xl3 }}>
      <ActivityIndicator color={COLORS.teal} size="small" />
      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>{label}</Text>
    </Card>
  );
}

export function ErrorCard({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card
      elevated
      accent="red"
      style={{ marginTop: SPACING.xl3, gap: SPACING.sm }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
        <Icon name="alert-circle" size={18} color={COLORS.red} />
        <Text style={[styles.listRowTitle, { color: COLORS.red }]}>Could not load data</Text>
      </View>
      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>
        {getApiErrorMessage(error)}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={[
            styles.smallAccentButton,
            {
              alignSelf: "flex-start",
              marginTop: SPACING.sm,
              borderColor: COLORS.borderLight,
              backgroundColor: COLORS.cardSoft,
            },
          ]}
        >
          <Icon name="refresh-cw" size={13} color={COLORS.teal} />
          <Text style={styles.smallAccentText}>Retry</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function EmptyCard({
  icon,
  title,
  text,
}: {
  icon?: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View style={[styles.emptyState, { gap: SPACING.xl, paddingVertical: SPACING.xl8 }]}>
      {icon ?? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: RADIUS.iconWrap,
            backgroundColor: COLORS.cardSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="file-x" size={24} color={COLORS.faint} />
        </View>
      )}
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={[styles.emptyStateText, { maxWidth: 260 }]}>{text}</Text>
    </View>
  );
}
