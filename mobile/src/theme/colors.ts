export const COLORS = {
  root: "#040707",
  screen: "#080e0e",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.42)",
  faint: "rgba(255,255,255,0.28)",
  border: "rgba(255,255,255,0.08)",
  card: "rgba(255,255,255,0.04)",
  cardSoft: "rgba(255,255,255,0.06)",
  teal: "#00d4a8",
  green: "#22c55e",
  gold: "#fbbf24",
  orange: "#f59e0b",
  red: "#f87171",
  purple: "#8b5cf6",
  blue: "#3b82f6",
} as const;

export type ColorKey = keyof typeof COLORS;
