export interface ExerciseFiltersResponse {
  body_parts: string[];
  equipment: string[];
  targets: string[];
}

export interface Exercise {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
  secondary_muscles: string[];
  instructions: string[];
  gif_url?: string;
}

export interface ExerciseListResponse {
  items: Exercise[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetExercisesParams {
  q?: string | null;
  body_part?: string | null;
  equipment?: string | null;
  target?: string | null;
  limit?: number;
  offset?: number;
}
