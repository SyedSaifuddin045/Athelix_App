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
  return lookup.get(id)?.name ?? null;
}

export function workoutTitle(
  session?: WorkoutSessionResponse | WorkoutSessionDetailResponse | null,
) {
  return session?.name || (session?.is_completed ? "Completed Workout" : "Workout");
}
