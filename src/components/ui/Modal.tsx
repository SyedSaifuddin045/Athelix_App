import { Pressable, Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";
import { styles } from "../../theme/styles";
import { Icon } from "./Icon";

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
  return (
    <View style={styles.confirmBackdrop}>
      <View style={[styles.confirmDialog, { gap: SPACING.xl }]}>
        <View style={{ alignItems: "center", gap: SPACING.sm }}>
          {destructive ? (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: COLORS.redDark,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: SPACING.xs,
              }}
            >
              <Icon name="alert-triangle" size={24} color={COLORS.red} />
            </View>
          ) : null}
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
        </View>
        <View style={[styles.confirmButtons, { gap: SPACING.lg }]}>
          <Pressable
            onPress={onCancel}
            style={[
              styles.confirmButtonCancel,
              {
                borderRadius: RADIUS.input,
                backgroundColor: COLORS.cardSoft,
                borderWidth: 1,
                borderColor: COLORS.border,
              },
            ]}
          >
            <Text style={[styles.confirmButtonText, { color: COLORS.muted }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[
              styles.confirmButtonConfirm,
              {
                borderRadius: RADIUS.input,
                backgroundColor: destructive ? COLORS.red : COLORS.teal,
              },
            ]}
          >
            <Text
              style={[
                styles.confirmButtonText,
                { color: destructive ? COLORS.text : "#000000" },
              ]}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
