import { Text, View } from "react-native";

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

  const allValues = segments.flat().map((s) => s.value);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  return (
    <View style={{ gap: SPACING.xs }}>
      <View style={[styles.chartArea, { height }]}>
        {[0.25, 0.5, 0.75].map((f, i) => (
          <View
            key={i}
            style={[
              styles.chartGridLine,
              { top: height * (1 - f) },
            ]}
          />
        ))}
        {segments.map((segment, si) =>
          segment.map((point, pi) => {
            if (pi === 0) return null;
            const prev = segment[pi - 1];
            const y1 = height - ((prev.value - min) / range) * height * 0.8 - height * 0.1;
            const y2 = height - ((point.value - min) / range) * height * 0.8 - height * 0.1;
            const x1 = ((pi - 1) / (segment.length - 1)) * 100;
            const x2 = (pi / (segment.length - 1)) * 100;
            const width = Math.abs(x2 - x1);

            return (
              <View
                key={`${si}-${pi}`}
                style={[
                  styles.chartSegment,
                  {
                    left: `${x1}%`,
                    top: Math.min(y1, y2),
                    width: `${width}%`,
                    height: Math.abs(y2 - y1) || 2,
                    backgroundColor: color,
                    transform: [{ rotate: `${Math.atan2(y2 - y1, width * 3)}rad` }],
                  },
                ]}
              />
            );
          })
        )}
        {segments.flat().map((point, i) => {
          const y = height - ((point.value - min) / range) * height * 0.8 - height * 0.1;
          const x = (i % (segments[0]?.length ?? 1)) / ((segments[0]?.length ?? 1) - 1) * 100;
          return (
            <View
              key={`dot-${i}`}
              style={[
                styles.chartDot,
                {
                  left: `${x}%`,
                  top: y - 4,
                  backgroundColor: color,
                  borderColor: COLORS.screen,
                },
              ]}
            />
          );
        })}
      </View>
      {segments[0] && (
        <View style={styles.chartLabels}>
          {segments[0].map((point, i) => (
            <Text key={i} style={styles.chartLabelText}>
              {point.label ?? ""}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
