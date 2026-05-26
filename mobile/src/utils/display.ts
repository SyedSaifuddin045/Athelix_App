import type {
  UserResponse,
  UserProfileResponse,
  ExerciseResponse,
  ExerciseDetailResponse,
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
  return lookup.get(id)?.name ?? id;
}

export function exerciseEmoji(
  exercise?: Pick<ExerciseResponse, "body_part" | "target"> | ExerciseDetailResponse | null,
) {
  const key = `${exercise?.target ?? ""} ${exercise?.body_part ?? ""}`.toLowerCase();
  if (key.includes("leg") || key.includes("quad") || key.includes("hamstring") || key.includes("glute")) return "🦵";
  if (key.includes("chest") || key.includes("shoulder")) return "🏋️";
  if (key.includes("back") || key.includes("lat")) return "💪";
  return "💪";
}

export function workoutTitle(
  session?: WorkoutSessionResponse | WorkoutSessionDetailResponse | null,
) {
  return session?.name || (session?.is_completed ? "Completed Workout" : "Workout");
}
