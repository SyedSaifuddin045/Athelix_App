import { apiRequest } from "../client";
import type { Exercise, ExerciseFiltersResponse, ExerciseListResponse, GetExercisesParams } from "../types";

export const exerciseService = {
  async getFilters(): Promise<ExerciseFiltersResponse> {
    return apiRequest<ExerciseFiltersResponse>("/exercises/filters");
  },

  async getExercises(params?: GetExercisesParams): Promise<ExerciseListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.q) searchParams.set("q", params.q);
    if (params?.body_part) searchParams.set("body_part", params.body_part);
    if (params?.equipment) searchParams.set("equipment", params.equipment);
    if (params?.target) searchParams.set("target", params.target);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/exercises?${queryString}` : "/exercises";
    
    return apiRequest<ExerciseListResponse>(endpoint);
  },

  async getExercise(exerciseId: string): Promise<Exercise> {
    return apiRequest<Exercise>(`/exercises/${exerciseId}`);
  },
};
