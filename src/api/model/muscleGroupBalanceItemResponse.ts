import type { MuscleGroupExerciseItemResponse } from './muscleGroupExerciseItemResponse';

export interface MuscleGroupBalanceItemResponse {
  muscle_group: string;
  weekly_sets: number;
  average_weekly_sets: number;
  score: number;
  status: string;
  recommendation: string;
  exercises: MuscleGroupExerciseItemResponse[];
}
