import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface DividerVerticalProps {}

export function DividerVertical(_props: DividerVerticalProps): React.JSX.Element {
  return <View style={styles.verticalDivider} />;
}

const styles = StyleSheet.create({
  verticalDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.07)", marginHorizontal: 8 },
});
