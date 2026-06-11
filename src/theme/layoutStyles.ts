import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

export const layoutStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.root, maxWidth: 390, width: "100%", alignSelf: "center" },
  screen: { flex: 1, backgroundColor: COLORS.screen },
  flexFill: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  centeredContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowGapTiny: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowGapSmall: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  rowGapLarge: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  threeUp: { flexDirection: "row", alignItems: "stretch", justifyContent: "space-between" },
  threeUpGrid: { flexDirection: "row", gap: 10 },
  twoUpGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  inlineSection: { marginTop: 14 },
  barRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
});
