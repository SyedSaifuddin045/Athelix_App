import { Text, View } from "react-native";
import { useState } from "react";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { COLORS } from "../../theme/colors";
import { SPACING, RADIUS } from "../../theme/spacing";
import { styles } from "../../theme/styles";

export function VerticalBars({
  data,
  height = 120,
  barColor = COLORS.teal,
  maxValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.barRow, { gap: SPACING.xs }]}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / max) * height, 4);
        return (
          <View key={i} style={[styles.barColumn, { gap: SPACING.xxs }]}>
            <View style={[styles.barTrackShell, { height }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    opacity: 0.4 + (item.value / max) * 0.6,
                    borderRadius: RADIUS.stepper,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function TrendChart({
  segments,
  height = 100,
  color = COLORS.teal,
}: {
  segments: { value: number; label?: string }[][];
  height?: number;
  color?: string;
}) {
  if (!segments.length) return null;
  const [chartWidth, setChartWidth] = useState(0);

  const allValues = segments.flat().map((s) => s.value);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const yPos = (value: number) => height - ((value - min) / range) * height * 0.8 - height * 0.1;

  const points = segments[0] ?? [];
  const total = points.length;
  const pad = 16;
  const svgHeight = height + 24;

  const xPos = (index: number) => {
    if (total <= 1) return chartWidth / 2;
    const t = index / (total - 1);
    return pad + t * (chartWidth - 2 * pad);
  };

  const polylinePoints = chartWidth > 0
    ? points.map((p, i) => `${xPos(i)},${yPos(p.value)}`).join(" ")
    : "";

  return (
    <View>
      <View style={[styles.chartArea, { height: svgHeight }]} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        {chartWidth > 0 && (
          <Svg width="100%" height={svgHeight} viewBox={`0 0 ${chartWidth} ${svgHeight}`}>
            {[0.25, 0.5, 0.75].map((f, i) => (
              <Line
                key={i}
                x1={pad}
                y1={height * (1 - f)}
                x2={chartWidth - pad}
                y2={height * (1 - f)}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={1}
              />
            ))}
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((point, i) => (
              <Circle
                key={i}
                cx={xPos(i)}
                cy={yPos(point.value)}
                r={4}
                fill={color}
                stroke={COLORS.screen}
                strokeWidth={2}
              />
            ))}
            {points.map((point, i) => (
              <SvgText
                key={i}
                x={xPos(i)}
                y={height + 12}
                fill="rgba(255,255,255,0.3)"
                fontSize={9}
                textAnchor="middle"
              >
                {point.label ?? ""}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}
