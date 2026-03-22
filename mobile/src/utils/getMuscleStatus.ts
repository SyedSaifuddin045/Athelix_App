import { COLORS } from "../theme/colors";

export type MuscleStatus = {
  label: "Over" | "On track" | "Under" | "Low";
  color: string;
};

export function getMuscleStatus(sets: number, target: number): MuscleStatus {
  const ratio = sets / target;
  if (ratio >= 1.1) return { label: "Over", color: COLORS.green };
  if (ratio >= 0.85) return { label: "On track", color: COLORS.teal };
  if (ratio >= 0.6) return { label: "Under", color: COLORS.orange };
  return { label: "Low", color: "#ef4444" };
}
