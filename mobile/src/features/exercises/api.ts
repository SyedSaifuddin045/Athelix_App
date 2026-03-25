import { api } from "../../lib/api/client";
import {
  exerciseDetailSchema,
  exerciseFiltersSchema,
  exerciseListSchema,
  type ExerciseDetail,
  type ExerciseFilters,
  type ExerciseListResponse,
} from "./schemas";

export interface ExerciseSearchParams {
  q?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  limit?: number;
  offset?: number;
}

export async function getExerciseFilters(): Promise<ExerciseFilters> {
  const response = await api.get("/exercises/filters");
  return exerciseFiltersSchema.parse(response.data);
}

export async function listExercises(
  params: ExerciseSearchParams,
): Promise<ExerciseListResponse> {
  const response = await api.get("/exercises", {
    params,
  });

  return exerciseListSchema.parse(response.data);
}

export async function getExerciseDetail(exerciseId: string): Promise<ExerciseDetail> {
  const response = await api.get(`/exercises/${exerciseId}`);
  return exerciseDetailSchema.parse(response.data);
}
