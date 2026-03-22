import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { COLORS } from "../../theme/colors";

interface TrendChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  labelEvery?: number;
  referenceValue?: number;
}

export function TrendChart({ data, color = COLORS.teal, height = 130, labelEvery = 2, referenceValue }: TrendChartProps): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartHeight = height - 28;
  const innerWidth = Math.max(width - 12, 1);
  const points = data.map((item, index) => ({
    x: 6 + (data.length === 1 ? innerWidth / 2 : (innerWidth * index) / (data.length - 1)),
    y: 6 + (chartHeight - 12) * (1 - (item.value - min) / range),
  }));

  const referenceY = referenceValue === undefined ? undefined : 6 + (chartHeight - 12) * (1 - (referenceValue - min) / range);

  return (
    <View style={{ height }} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        <View style={[styles.chartGridLine, { top: 6 }]} />
        <View style={[styles.chartGridLine, { top: chartHeight / 2 }]} />
        <View style={[styles.chartGridLine, { top: chartHeight - 6 }]} />
        {referenceY !== undefined ? <View style={[styles.referenceLine, { top: referenceY }]} /> : null}
        {points.map((point, index) => {
          if (index === data.length - 1) return null;
          const next = points[index + 1];
          const distance = Math.hypot(next.x - point.x, next.y - point.y);
          const angle = Math.atan2(next.y - point.y, next.x - point.x);
          return (
            <View
              key={`segment-${index}`}
              style={[
                styles.chartSegment,
                {
                  width: distance,
                  left: (point.x + next.x) / 2 - distance / 2,
                  top: (point.y + next.y) / 2 - 1,
                  backgroundColor: color,
                  transform: [{ rotateZ: `${angle}rad` }],
                },
              ]}
            />
          );
        })}
        {points.map((point, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.chartDot,
              {
                left: point.x - 4,
                top: point.y - 4,
                backgroundColor: index === data.length - 1 ? color : COLORS.screen,
                borderColor: color,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.chartLabels}>
        {data.map((item, index) => (
          <Text key={item.label} style={styles.chartLabelText}>
            {index % labelEvery === 0 || index === data.length - 1 ? item.label : " "}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartArea: { position: "relative" },
  chartGridLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  referenceLine: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed", borderColor: "rgba(0,212,168,0.32)" },
  chartSegment: { position: "absolute", height: 2, borderRadius: 999 },
  chartDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  chartLabelText: { flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 8, textAlign: "center" },
});
