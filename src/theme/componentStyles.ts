import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const componentStyles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 16 },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  tagText: { fontSize: 10, fontWeight: "700" },
  progressTrack: { width: "100%", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  optionChip: { borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 10 },
  optionChipText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textAlign: "center" },
  modalScrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" },
  modalBackdrop: { flex: 1 },
  bottomSheet: { backgroundColor: "#111d1b", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 24, paddingTop: 14, paddingBottom: 26 },
});
