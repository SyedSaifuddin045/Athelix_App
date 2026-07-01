import { Modal, Pressable, Text, View } from "react-native";
import { useTheme } from "@tamagui/core";

import { radii } from "../../design-system/tokens/radii";
import { spacing } from "../../design-system/tokens/spacing";
import { AppIcon } from "../../design-system/icons/AppIcon";

export function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  destructive,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const theme = useTheme();

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable style={{ flex: 1, position: "absolute", inset: 0 }} onPress={onCancel} />
        <View
        style={{
          width: "100%",
          maxWidth: 320,
          borderRadius: radii.modal,
          backgroundColor: theme.surface?.get() ?? "#111d1b",
          borderWidth: 1,
          borderColor: theme.borderColor?.get(),
          padding: spacing.xl4,
          gap: spacing.xl,
        }}
      >
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {destructive ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colorRedDark?.get() ?? "rgba(239,68,68,0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.xs,
              }}
            >
              <AppIcon name="alert-triangle" size={24} color={theme.colorRed?.get() ?? "#EF4444"} />
            </View>
          ) : null}
          <Text
            style={{
              color: theme.color?.get() ?? "#FFFFFF",
              fontSize: 17,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: radii.input,
              backgroundColor: theme.surface2?.get(),
              borderWidth: 1,
              borderColor: theme.borderColor?.get(),
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)",
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: radii.input,
              backgroundColor: destructive
                ? (theme.colorRed?.get() ?? "#EF4444")
                : (theme.accent?.get() ?? "#FF5A36"),
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: destructive
                  ? (theme.color?.get() ?? "#FFFFFF")
                  : "#000000",
              }}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
        </View>
      </View>
    </Modal>
  );
}
