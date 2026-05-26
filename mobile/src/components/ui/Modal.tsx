import { Modal, Pressable, Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.confirmBackdrop} onPress={onCancel}>
        <View style={styles.confirmDialog}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmButtons}>
            <Pressable onPress={onCancel} style={styles.confirmButtonCancel}>
              <Text style={styles.confirmButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButtonConfirm, destructive ? { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.3)" } : null]}
            >
              <Text style={[styles.confirmButtonText, destructive ? { color: COLORS.red } : null]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
