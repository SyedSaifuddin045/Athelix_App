export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

export function formatCompactNumber(value?: number | null) {
  if (value == null) return "0";
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

export function formatKg(value?: number | null, suffix = "kg") {
  if (value == null) return "-";
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return suffix ? `${rounded} ${suffix}` : rounded;
}

export function formatVolume(value?: number | null) {
  if (value == null) return "0 kg";
  return `${formatCompactNumber(value)} kg`;
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTimeLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
