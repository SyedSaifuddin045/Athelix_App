export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}

export function parseDurationSec(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  const int = parseInt(cleaned, 10);
  return isNaN(int) ? null : int;
}

export function formatDurationSec(seconds: number | null | undefined): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function parseDistanceM(value: string): number | null {
  const cleaned = value.trim().replace(/[km]/gi, "");
  if (!cleaned) return null;
  const km = parseFloat(cleaned);
  return isNaN(km) ? null : Math.round(km * 1000);
}

export function formatDistanceM(meters: number | null | undefined): string {
  if (meters == null) return "";
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatCalories(value: number | null | undefined): string {
  if (value == null) return "0";
  return `${Math.round(value)}`;
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
