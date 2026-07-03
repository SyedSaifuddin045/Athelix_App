import type {
  UserResponse,
  UserProfileResponse,
  WorkoutSessionResponse,
  WorkoutSessionDetailResponse,
} from "../api/model";

export function displayName(user?: UserResponse | null, profile?: UserProfileResponse | null) {
  return profile?.display_name || user?.username || "Athlete";
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AT";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function nameForExercise(id: string, lookup: Map<string, any>) {
  const name = lookup.get(id)?.name;
  if (name) return name;
  // Not in lookup — humanize raw ID
  if (/^\d+$/.test(id)) return `Unknown (#${id})`;
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: "#FF5A36",
  back: "#22C55E",
  leg: "#8B5CF6",
  quad: "#8B5CF6",
  hamstring: "#8B5CF6",
  glute: "#8B5CF6",
  shoulder: "#3B82F6",
  arm: "#F59E0B",
  bicep: "#F59E0B",
  tricep: "#F59E0B",
  core: "#EC4899",
  ab: "#EC4899",
  waist: "#EC4899",
};

export function muscleAccentColor(muscle?: string | null): string | undefined {
  if (!muscle) return undefined;
  const key = muscle.toLowerCase();
  for (const [substring, color] of Object.entries(MUSCLE_COLORS)) {
    if (key.includes(substring)) return color;
  }
  return undefined;
}

export function workoutTitle(
  session?: WorkoutSessionResponse | WorkoutSessionDetailResponse | null,
) {
  return session?.name || (session?.is_completed ? "Completed Workout" : "Workout");
}
