import { apiClient } from "../client";
import type {
  ExerciseProgress,
  Mesocycle,
  MesocycleAnalytics,
  MesocycleDetail,
  MuscleBalance,
  PersonalRecord,
} from "../types";
import type { PaginationParams } from "../types/base";

export const recordService = {
  async getRecords(params?: PaginationParams & { exercise_id?: string; record_type?: string }): Promise<{
    data: PersonalRecord[];
    total: number;
  }> {
    const response = await apiClient.get<{ data: PersonalRecord[]; total: number }>(
      "/personal-records",
      { params }
    );
    return response.data;
  },

  async getRecord(recordId: string): Promise<PersonalRecord> {
    const response = await apiClient.get<PersonalRecord>(`/personal-records/${recordId}`);
    return response.data;
  },
};

export const progressService = {
  async getExerciseProgress(
    exerciseId: string
  ): Promise<ExerciseProgress> {
    const response = await apiClient.get<ExerciseProgress>(`/progress/${exerciseId}`);
    return response.data;
  },
};

export const analyticsService = {
  async getMuscleBalance(params?: {
    weeks?: number;
    reference_date?: string;
    mesocycle_id?: string;
  }): Promise<MuscleBalance> {
    const response = await apiClient.get<MuscleBalance>("/analytics/muscle-balance", { params });
    return response.data;
  },
};

export const mesocycleService = {
  async getMesocycles(params?: PaginationParams): Promise<{
    data: Mesocycle[];
    total: number;
  }> {
    const response = await apiClient.get<{ data: Mesocycle[]; total: number }>(
      "/mesocycles",
      { params }
    );
    return response.data;
  },

  async getMesocycle(mesocycleId: string): Promise<MesocycleDetail> {
    const response = await apiClient.get<MesocycleDetail>(`/mesocycles/${mesocycleId}`);
    return response.data;
  },

  async getMesocycleAnalytics(mesocycleId: string): Promise<MesocycleAnalytics> {
    const response = await apiClient.get<MesocycleAnalytics>(
      `/mesocycles/${mesocycleId}/analytics`
    );
    return response.data;
  },

  async createMesocycle(data: {
    name: string;
    description?: string;
    goal?: string;
    start_date: string;
    end_date: string;
  }): Promise<Mesocycle> {
    const response = await apiClient.post<Mesocycle>("/mesocycles", data);
    return response.data;
  },

  async updateMesocycle(
    mesocycleId: string,
    data: Partial<{
      name: string;
      description: string;
      goal: string;
      status: "planned" | "active" | "completed" | "cancelled";
    }>
  ): Promise<Mesocycle> {
    const response = await apiClient.patch<Mesocycle>(`/mesocycles/${mesocycleId}`, data);
    return response.data;
  },

  async deleteMesocycle(mesocycleId: string): Promise<void> {
    await apiClient.delete(`/mesocycles/${mesocycleId}`);
  },
};
