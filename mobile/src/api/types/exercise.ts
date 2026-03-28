export interface Exercise {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
  target: string | null;
  instructions: ExerciseInstruction[];
  secondary_muscles: ExerciseSecondaryMuscle[];
}

export interface ExerciseInstruction {
  id: number;
  step_number: number | null;
  instruction: string | null;
}

export interface ExerciseSecondaryMuscle {
  id: number;
  muscle: string;
}

export interface ExerciseListItem {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
  target: string | null;
}

export interface ExerciseFilters {
  body_parts: string[];
  equipment: string[];
  targets: string[];
}

export interface ExerciseSet {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  exercise_name?: string;
  exercise_emoji?: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe?: number;
  is_warmup: boolean;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
}

export interface CreateSetRequest {
  exercise_id: string;
  reps: number;
  weight: number;
  rpe?: number;
  is_warmup?: boolean;
  notes?: string;
}

export interface UpdateSetRequest {
  reps?: number;
  weight?: number;
  rpe?: number;
  is_completed?: boolean;
  notes?: string;
}
