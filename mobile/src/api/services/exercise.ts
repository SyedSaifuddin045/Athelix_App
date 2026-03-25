import { apiClient } from "../client";
import type {
  Exercise,
  ExerciseFilters,
  ExerciseListItem,
  ExerciseSet,
  CreateSetRequest,
  UpdateSetRequest,
} from "../types";
import type { PaginationParams } from "../types/base";

export const exerciseService = {
  async getExercises(params?: PaginationParams & {
    muscle?: string;
    equipment?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{ data: ExerciseListItem[]; total: number }> {
    const response = await apiClient.get<{ data: ExerciseListItem[]; total: number }>(
      "/exercises",
      { params }
    );
    return response.data;
  },

  async getFilters(): Promise<ExerciseFilters> {
    const response = await apiClient.get<ExerciseFilters>("/exercises/filters");
    return response.data;
  },

  async getExercise(exerciseId: string): Promise<Exercise> {
    const response = await apiClient.get<Exercise>(`/exercises/${exerciseId}`);
    return response.data;
  },
};

export const setService = {
  async getSets(sessionId: string): Promise<ExerciseSet[]> {
    const response = await apiClient.get<ExerciseSet[]>(`/workout-sessions/${sessionId}/sets`);
    return response.data;
  },

  async createSet(sessionId: string, data: CreateSetRequest): Promise<ExerciseSet> {
    const response = await apiClient.post<ExerciseSet>(
      `/workout-sessions/${sessionId}/sets`,
      data
    );
    return response.data;
  },

  async updateSet(
    sessionId: string,
    setId: string,
    data: UpdateSetRequest
  ): Promise<ExerciseSet> {
    const response = await apiClient.patch<ExerciseSet>(
      `/workout-sessions/${sessionId}/sets/${setId}`,
      data
    );
    return response.data;
  },

  async deleteSet(sessionId: string, setId: string): Promise<void> {
    await apiClient.delete(`/workout-sessions/${sessionId}/sets/${setId}`);
  },
};
