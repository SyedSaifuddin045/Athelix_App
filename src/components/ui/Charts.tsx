import { Text, View } from "react-native";
import { useState } from "react";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { useTheme } from "@tamagui/core";
import { spacing } from "../../design-system/tokens/spacing";
import { radii } from "../../design-system/tokens/radii";

export function VerticalBars({
  data,
  height = 120,
  barColor: barColorProp,
  maxValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
  maxValue?: number;
}) {
  const theme = useTheme();
  const barColor = barColorProp ?? theme.accent?.get() ?? "#FF5A36";
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.xs }}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / max) * height, 4);
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: spacing.xxs }}>
            <Text style={{ color: barColor, fontSize: 10, fontWeight: "700", minHeight: 14 }}>
              {item.value > 0 ? item.value : ""}
            </Text>
            <View style={{ justifyContent: "flex-end", width: 26, height }}>
              <View
                style={{
                  width: 22,
                  borderRadius: radii.stepper,
                  alignSelf: "center",
                  height: barHeight,
                  backgroundColor: barColor,
                  opacity: 0.4 + (item.value / max) * 0.6,
                }}
              />
            </View>
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 8 }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function TrendChart({
  segments,
  height = 100,
  color: colorProp,
  series,
}: {
  segments: { value: number; label?: string }[][];
  height?: number;
  color?: string;
  series?: { data: { value: number; label?: string }[]; color: string; label: string }[];
}) {
  const theme = useTheme();
  const color = colorProp ?? theme.accent?.get() ?? "#FF5A36";
  const [chartWidth, setChartWidth] = useState(0);

  if (series && series.length >= 2) {
    const allValues = series.flatMap((s) => s.data.map((d) => d.value));
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const pad = 16;
    const svgHeight = height + 24;

    const yPos = (value: number) => height - ((value - min) / range) * height * 0.8 - height * 0.1;

    const xPositions = series.map((s) => {
      const total = s.data.length;
      return s.data.map((_, i) => {
        if (total <= 1) return chartWidth / 2;
        const t = i / (total - 1);
        return pad + t * (chartWidth - 2 * pad);
      });
    });

    return (
      <View>
        <View style={{ flexDirection: "row", gap: spacing.lg, marginBottom: spacing.sm }}>
          {series.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing.xxs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={[{ position: "relative" }, { height: svgHeight }]} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
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
              {series.map((s, si) => {
                const xs = xPositions[si];
                const pts = s.data.map((d, i) => `${xs[i]},${yPos(d.value)}`).join(" ");
                return (
                  <Polyline
                    key={si}
                    points={pts}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                );
              })}
              {series.map((s, si) => {
                const xs = xPositions[si];
                return s.data.map((d, i) => (
                  <Circle
                    key={`${si}-${i}`}
                    cx={xs[i]}
                    cy={yPos(d.value)}
                    r={4}
                    fill={s.color}
                    stroke={theme.backgroundFocus?.get()}
                    strokeWidth={2}
                  />
                ));
              })}
              {series[0].data.map((d, i) => (
                <SvgText
                  key={i}
                  x={xPositions[0][i]}
                  y={height + 12}
                  fill="rgba(255,255,255,0.3)"
                  fontSize={9}
                  textAnchor="middle"
                >
                  {d.label ?? ""}
                </SvgText>
              ))}
            </Svg>
          )}
        </View>
      </View>
    );
  }

  if (!segments.length) return null;

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
      <View style={[{ position: "relative" }, { height: svgHeight }]} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
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
                stroke={theme.backgroundFocus?.get()}
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
