import type { ExerciseSet } from "./exercise";

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  estimated_duration_minutes?: number;
  exercises_count: number;
  total_sets: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateDetail extends WorkoutTemplate {
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_emoji?: string;
  order_index: number;
  sets: TemplateExerciseSet[];
  notes?: string;
}

export interface TemplateExerciseSet {
  id: string;
  reps: number;
  rpe?: number;
  rest_seconds?: number;
  order_index: number;
}

export interface CreateTemplateExerciseRequest {
  exercise_id: string;
  order_index?: number;
  sets: Omit<TemplateExerciseSet, "id">[];
  notes?: string;
}

export interface UpdateTemplateExerciseRequest {
  order_index?: number;
  sets?: Omit<TemplateExerciseSet, "id">[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  template_id?: string;
  mesocycle_id?: string;
  status: "in_progress" | "completed" | "cancelled";
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  mood?: string;
  location?: string;
  notes?: string;
  total_sets: number;
  completed_sets: number;
  total_volume: number;
  prs_count: number;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  exercises: SessionExercise[];
}

export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_emoji?: string;
  order_index: number;
  sets: ExerciseSet[];
  notes?: string;
}

export interface CreateSessionRequest {
  name: string;
  template_id?: string;
  mesocycle_id?: string;
  mood?: string;
  location?: string;
}

export interface UpdateSessionRequest {
  name?: string;
  mood?: string;
  location?: string;
  notes?: string;
  status?: "in_progress" | "completed" | "cancelled";
  completed_at?: string;
}
