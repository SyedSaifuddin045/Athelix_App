import { COLORS } from "../theme/colors";

export function shadow(color: string) {
  return {
    shadowColor: color,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  } as const;
}

export function getMuscleStatus(sets: number, target: number) {
  const ratio = sets / target;
  if (ratio >= 1.1) return { label: "Over", color: COLORS.green };
  if (ratio >= 0.85) return { label: "On track", color: COLORS.teal };
  if (ratio >= 0.6) return { label: "Under", color: COLORS.orange };
  return { label: "Low", color: "#ef4444" };
}

export function toNumberId(id?: string | number | null) {
  if (typeof id === "number") return Number.isFinite(id) ? id : null;
  if (!id) return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}
