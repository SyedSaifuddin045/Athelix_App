import { createFont, isWeb } from "@tamagui/core";

const systemFamily = isWeb ? "-apple-system, Inter, system-ui, sans-serif" : "System";

export const fontHeading = createFont({
  family: systemFamily,
  size: {
    caption: 10,
    label: 11,
    bodySmall: 12,
    body: 13,
    bodyLarge: 14,
    button: 15,
    cardTitle: 15,
    sectionTitle: 17,
    screenTitle: 28,
    heroMetric: 20,
    bigMetric: 40,
    hugeMetric: 56,
  },
  lineHeight: {
    caption: 13,
    label: 14,
    bodySmall: 16,
    body: 18,
    bodyLarge: 20,
    button: 20,
    cardTitle: 20,
    sectionTitle: 22,
    screenTitle: 34,
    heroMetric: 26,
    bigMetric: 48,
    hugeMetric: 64,
  },
  weight: {
    1: "400",
    2: "500",
    3: "600",
    4: "700",
    5: "800",
    6: "900",
  },
  letterSpacing: {
    caption: 0,
    label: 0.4,
    body: 0,
    button: 0.3,
  },
});

export const fontBody = fontHeading;
