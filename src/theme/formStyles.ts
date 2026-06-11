import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const formStyles = StyleSheet.create({
  primaryButton: { minHeight: 56, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  primaryButtonText: { color: "#000000", fontSize: 15, fontWeight: "800" },
  oauthButton: { minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  oauthButtonText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  input: { width: "100%", minHeight: 52, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, paddingHorizontal: 16, fontSize: 14 },
  inputWrap: { position: "relative" },
  inputWithRight: { paddingRight: 46 },
  inputRightIcon: { position: "absolute", right: 14, top: 18 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  fieldError: { color: COLORS.red, fontSize: 10, marginTop: 6, marginLeft: 2 },
  errorBox: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" },
  errorText: { color: COLORS.red, fontSize: 12 },
  formStack: { gap: 14 },
  miniInput: { flex: 1, minWidth: 0, minHeight: 38, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", color: COLORS.text, textAlign: "center", fontSize: 13, paddingHorizontal: 4 },
  selectableRow: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "rgba(255,255,255,0.03)", justifyContent: "center", paddingHorizontal: 14 },
  chipButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.04)" },
  chipButtonText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  radioOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
});
