export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  instructions: string[];
  tips: string[];
  emoji?: string;
}

export interface ExerciseListItem {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  emoji?: string;
}

export interface ExerciseFilters {
  muscles: string[];
  equipment: string[];
  difficulties: string[];
  categories: string[];
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
