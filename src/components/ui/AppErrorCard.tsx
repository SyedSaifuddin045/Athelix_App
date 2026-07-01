import { Pressable, Text, View } from "react-native";
import { useTheme } from "@tamagui/core";
import { spacing } from "../../design-system/tokens/spacing";
import { AppIcon } from "../../design-system/icons/AppIcon";
import { AppCard } from "./AppCard";
import { getApiErrorMessage } from "../../api/client";

interface AppErrorCardProps {
  error: unknown;
  onRetry?: () => void;
}

export function AppErrorCard({ error, onRetry }: AppErrorCardProps) {
  const theme = useTheme();

  return (
    <AppCard elevated style={{ marginTop: spacing.xl3, gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <AppIcon
          name="alert-circle"
          size={18}
          color={theme.colorRed?.get() ?? "#EF4444"}
        />
        <Text
          style={{
            color: theme.colorRed?.get() ?? "#EF4444",
            fontSize: 13,
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
          <AppIcon
            name="refresh-cw"
            size={13}
            color={theme.accent?.get() ?? "#FF5A36"}
          />
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
    </AppCard>
  );
}
