import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../theme/colors";

interface VerticalBarsProps {
  data: { label?: string; day?: string; value: number; highlight?: boolean }[];
  height?: number;
  activeColor?: string;
  mutedColor?: string;
}

export function VerticalBars({ data, height = 70, activeColor = COLORS.teal, mutedColor = "rgba(255,255,255,0.18)" }: VerticalBarsProps): React.JSX.Element {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.barRow, { height }]}>
        {data.map((item, index) => {
          const barHeight = item.value === 0 ? 6 : Math.max(14, (item.value / max) * (height - 8));
          const isActive = item.highlight ?? index === data.length - 1;
          return (
            <View key={`${item.label ?? item.day}-${index}`} style={styles.barColumn}>
              <View style={[styles.barTrackShell, { height }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: item.value === 0 ? "rgba(255,255,255,0.08)" : isActive ? activeColor : mutedColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label ?? item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  barRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  barColumn: { flex: 1, alignItems: "center" },
  barTrackShell: { justifyContent: "flex-end", width: 26 },
  bar: { width: 22, borderRadius: 6, alignSelf: "center" },
  barLabel: { color: COLORS.faint, fontSize: 10, marginTop: 8, fontWeight: "500" },
});
