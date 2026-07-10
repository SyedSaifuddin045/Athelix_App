import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "@tamagui/core";

import { getApiErrorMessage } from "../../api/client";
import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";
import { AppIcon } from "../../design-system/icons/AppIcon";
import { AppCard } from "./AppCard";
import { AnimatedEnter } from "../../design-system/layout/AnimatedEnter";

const ACCENT_BORDER: Record<string, string> = {
  none: "transparent",
  green: "colorGreenDark",
  purple: "colorPurpleDark",
  blue: "colorBlueDark",
  red: "colorRedDark",
  coral: "accent",
  gold: "colorGold",
};

const ACCENT_BG: Record<string, string> = {
  none: "transparent",
  green: "colorGreenDark",
  purple: "colorPurpleDark",
  blue: "colorBlueDark",
  red: "colorRedDark",
};

export function Card({
  children,
  style,
  elevated,
  accent,
  accentColor,
  animate,
  animationDelay,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  accent?: keyof typeof ACCENT_BORDER | "none";
  accentColor?: string;
  animate?: boolean;
  animationDelay?: number;
}) {
  const theme = useTheme();
  const borderColor =
    accent && accent in ACCENT_BORDER
      ? (theme[ACCENT_BORDER[accent] as keyof typeof theme]?.get() ?? theme.borderColor?.get())
      : theme.borderColor?.get();
  const bgColor =
    accent && accent in ACCENT_BG
      ? (theme[ACCENT_BG[accent] as keyof typeof theme]?.get() ?? theme.surface1?.get())
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

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  const theme = useTheme();
  return (
    <Card elevated style={{ alignItems: "center", gap: spacing.lg, marginTop: spacing.xl3 }}>
      <ActivityIndicator size="small" color={theme.accent?.get() ?? "#FF5A36"} />
      <Text
        style={{
          color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
          fontSize: 11,
          lineHeight: 16,
        }}
      >
        {label}
      </Text>
    </Card>
  );
}

export function ErrorCard({ error, onRetry, onDismiss, compact }: { error: unknown; onRetry?: () => void; onDismiss?: () => void; compact?: boolean }) {
  const theme = useTheme();
  const errorContent = (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <AppIcon name="alert-circle" size={compact ? 16 : 18} color={theme.colorRed?.get() ?? "#EF4444"} />
        <Text
          style={{
            color: theme.colorRed?.get() ?? "#EF4444",
            fontSize: compact ? 12 : 13,
            fontWeight: "700",
          }}
        >
          Could not load data
        </Text>
      </View>
      <Text
        style={{
          color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
          fontSize: 11,
          lineHeight: 16,
        }}
      >
        {getApiErrorMessage(error)}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: 14,
            backgroundColor: theme.surface2?.get(),
            borderWidth: 1,
            borderColor: theme.borderColor?.get(),
            alignSelf: "flex-start",
            marginTop: spacing.xs,
          }}
        >
          <AppIcon name="refresh-cw" size={13} color={theme.accent?.get() ?? "#FF5A36"} />
          <Text
            style={{
              color: theme.accent?.get() ?? "#FF5A36",
              fontSize: 12,
              fontWeight: "700",
            }}
          >
            Retry
          </Text>
        </Pressable>
      ) : null}
      {onRetry && (
        <Text
          style={{
            color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
            fontSize: 10,
            marginTop: spacing.xs,
          }}
        >
          Tap to retry
        </Text>
      )}
    </>
  );

  const content = (
    <View style={{ position: "relative" }}>
      {errorContent}
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          hitSlop={6}
          style={{ position: "absolute", bottom: 0, right: 0, padding: spacing.xs }}
        >
          <Text
            style={{
              color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
              fontSize: 10,
            }}
          >
            Dismiss
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (compact) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.md,
          paddingHorizontal: spacing.xl3,
          paddingVertical: spacing.xl,
          borderRadius: radii.card,
          backgroundColor: (theme.surface1?.get() ?? "rgba(255,255,255,0.05)") as string,
          borderWidth: 1,
          borderColor: (theme.colorRed?.get() ?? "#EF4444") + "33",
        }}
      >
        {content}
      </View>
    );
  }

  return (
    <Card elevated accent="red" style={{ marginTop: spacing.xl3, gap: spacing.sm }}>
      {content}
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
  const theme = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        gap: spacing.xl,
        paddingVertical: spacing.xl8,
      }}
    >
      {icon ?? (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.iconWrap,
            backgroundColor: theme.surface2?.get(),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="file-x" size={24} color={theme.colorFaint?.get()} />
        </View>
      )}
      <Text
        style={{
          color: theme.color?.get() ?? "#FFFFFF",
          fontSize: 15,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
          fontSize: 13,
          textAlign: "center",
          maxWidth: 260,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
