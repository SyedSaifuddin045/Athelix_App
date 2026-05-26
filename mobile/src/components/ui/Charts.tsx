import { useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

export function VerticalBars({
  data,
  height = 80,
  activeColor = COLORS.teal,
  mutedColor = "rgba(255,255,255,0.18)",
}: {
  data: { label?: string; day?: string; value: number; highlight?: boolean }[];
  height?: number;
  activeColor?: string;
  mutedColor?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <View style={{ height: height + 20 }}>
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

export function TrendChart({
  data,
  color = COLORS.teal,
  height = 130,
  labelEvery = 2,
  referenceValue,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  labelEvery?: number;
  referenceValue?: number;
}) {
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

  const referenceY =
    referenceValue === undefined ? undefined : 6 + (chartHeight - 12) * (1 - (referenceValue - min) / range);

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
