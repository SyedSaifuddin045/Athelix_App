import { apiClient } from "../client";
import type {
  WorkoutSession,
  WorkoutSessionDetail,
  CreateSessionRequest,
  UpdateSessionRequest,
  WorkoutTemplate,
  WorkoutTemplateDetail,
  TemplateExercise,
  CreateTemplateExerciseRequest,
  UpdateTemplateExerciseRequest,
  ExerciseSetResponse,
} from "../types";
import type { PaginationParams } from "../types/base";

export const sessionService = {
  async getSessions(params?: PaginationParams): Promise<{
    data: WorkoutSession[];
    total: number;
  }> {
    const response = await apiClient.get<WorkoutSession[]>(
      "/workout-sessions",
      { params }
    );
    const data = Array.isArray(response.data) ? response.data : [];
    return { data, total: data.length };
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

  async getSessionSets(sessionId: string): Promise<ExerciseSetResponse[]> {
    const response = await apiClient.get<ExerciseSetResponse[]>(
      `/workout-sessions/${sessionId}/sets`
    );
    return response.data;
  },

  async createSet(
    sessionId: string,
    data: {
      exercise_id: string;
      set_number: number;
      set_type?: string;
      reps?: number;
      weight_kg?: number;
      rpe?: number;
      notes?: string;
    }
  ): Promise<ExerciseSetResponse> {
    const response = await apiClient.post<ExerciseSetResponse>(
      `/workout-sessions/${sessionId}/sets`,
      data
    );
    return response.data;
  },
};

export const templateService = {
  async getTemplates(): Promise<{
    data: WorkoutTemplate[];
    total: number;
  }> {
    const response = await apiClient.get<WorkoutTemplate[]>("/workout-templates");
    const data = Array.isArray(response.data) ? response.data : [];
    return { data, total: data.length };
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
  ): Promise<TemplateExercise> {
    const response = await apiClient.post<TemplateExercise>(
      `/workout-templates/${templateId}/exercises`,
      data
    );
    return response.data;
  },

  async updateExercise(
    templateId: string,
    exerciseId: string,
    data: UpdateTemplateExerciseRequest
  ): Promise<TemplateExercise> {
    const response = await apiClient.patch<TemplateExercise>(
      `/workout-templates/${templateId}/exercises/${exerciseId}`,
      data
    );
    return response.data;
  },

  async deleteExercise(templateId: string, exerciseId: string): Promise<void> {
    await apiClient.delete(`/workout-templates/${templateId}/exercises/${exerciseId}`);
  },
};
