import type { ExerciseSet } from "./exercise";

export interface WorkoutTemplate {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  exercises_count?: number;
  total_sets?: number;
  estimated_duration_minutes?: number;
}

export interface WorkoutTemplateDetail extends WorkoutTemplate {
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: number;
  template_id: number;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  notes: string | null;
}

export interface CreateTemplateExerciseRequest {
  exercise_id: string;
  order_index: number;
  target_sets?: number;
  target_reps?: number;
  target_rpe?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface UpdateTemplateExerciseRequest {
  exercise_id?: string;
  order_index?: number;
  target_sets?: number;
  target_reps?: number;
  target_rpe?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: number;
  user_id: number;
  template_id: number | null;
  mesocycle_id: number | null;
  name: string | null;
  started_at: string;
  finished_at: string | null;
  perceived_exertion: number | null;
  mood: string | null;
  location: string | null;
  notes: string | null;
  is_completed: boolean;
  exercises_count?: number;
  total_sets?: number;
  estimated_duration_minutes?: number;
  duration_minutes?: number;
  total_volume?: number;
  prs_count?: number;
}

export interface ExerciseSetResponse {
  id: number;
  session_id: number;
  exercise_id: string;
  set_number: number;
  set_type: string;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  distance_m: number | null;
  rpe: number | null;
  is_pr: boolean;
  notes: string | null;
  logged_at: string;
}

export interface WorkoutSessionDetail extends WorkoutSession {
  sets: ExerciseSetResponse[];
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
  is_completed?: boolean;
  status?: "in_progress" | "completed" | "cancelled";
  completed_at?: string;
}
