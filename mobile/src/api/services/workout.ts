import { apiClient } from "../client";
import type {
  WorkoutSession,
  WorkoutSessionDetail,
  CreateSessionRequest,
  UpdateSessionRequest,
  WorkoutTemplate,
  WorkoutTemplateDetail,
  CreateTemplateExerciseRequest,
  UpdateTemplateExerciseRequest,
} from "../types";
import type { PaginationParams } from "../types/base";

export const sessionService = {
  async getSessions(params?: PaginationParams): Promise<{
    data: WorkoutSession[];
    total: number;
  }> {
    const response = await apiClient.get<{ data: WorkoutSession[]; total: number }>(
      "/workout-sessions",
      { params }
    );
    return response.data;
  },

  async getSession(sessionId: string): Promise<WorkoutSessionDetail> {
    const response = await apiClient.get<WorkoutSessionDetail>(
      `/workout-sessions/${sessionId}`
    );
    return response.data;
  },

  async createSession(data: CreateSessionRequest): Promise<WorkoutSession> {
    const response = await apiClient.post<WorkoutSession>("/workout-sessions", data);
    return response.data;
  },

  async updateSession(
    sessionId: string,
    data: UpdateSessionRequest
  ): Promise<WorkoutSession> {
    const response = await apiClient.patch<WorkoutSession>(
      `/workout-sessions/${sessionId}`,
      data
    );
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/workout-sessions/${sessionId}`);
  },
};

export const templateService = {
  async getTemplates(params?: PaginationParams): Promise<{
    data: WorkoutTemplate[];
    total: number;
  }> {
    const response = await apiClient.get<{ data: WorkoutTemplate[]; total: number }>(
      "/workout-templates",
      { params }
    );
    return response.data;
  },

  async getTemplate(templateId: string): Promise<WorkoutTemplateDetail> {
    const response = await apiClient.get<WorkoutTemplateDetail>(
      `/workout-templates/${templateId}`
    );
    return response.data;
  },

  async createTemplate(data: { name: string; description?: string }): Promise<WorkoutTemplate> {
    const response = await apiClient.post<WorkoutTemplate>("/workout-templates", data);
    return response.data;
  },

  async updateTemplate(
    templateId: string,
    data: { name?: string; description?: string }
  ): Promise<WorkoutTemplate> {
    const response = await apiClient.patch<WorkoutTemplate>(
      `/workout-templates/${templateId}`,
      data
    );
    return response.data;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/workout-templates/${templateId}`);
  },

  async addExercise(
    templateId: string,
    data: CreateTemplateExerciseRequest
  ): Promise<WorkoutTemplateDetail["exercises"][0]> {
    const response = await apiClient.post<
      WorkoutTemplateDetail["exercises"][0]
    >(`/workout-templates/${templateId}/exercises`, data);
    return response.data;
  },

  async updateExercise(
    templateId: string,
    exerciseId: string,
    data: UpdateTemplateExerciseRequest
  ): Promise<WorkoutTemplateDetail["exercises"][0]> {
    const response = await apiClient.patch<WorkoutTemplateDetail["exercises"][0]>(
      `/workout-templates/${templateId}/exercises/${exerciseId}`,
      data
    );
    return response.data;
  },

  async deleteExercise(templateId: string, exerciseId: string): Promise<void> {
    await apiClient.delete(`/workout-templates/${templateId}/exercises/${exerciseId}`);
  },
};
