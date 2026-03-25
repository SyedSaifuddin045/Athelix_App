import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordService, progressService, analyticsService, mesocycleService } from "../api/services";
import { queryKeys } from "./useUser";

export function usePersonalRecords(params?: {
  limit?: number;
  offset?: number;
  exercise_id?: string;
  record_type?: string;
}) {
  return useQuery({
    queryKey: queryKeys.records(params),
    queryFn: () => recordService.getRecords(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePersonalRecord(recordId: string) {
  return useQuery({
    queryKey: ["record", recordId] as const,
    queryFn: () => recordService.getRecord(recordId),
    enabled: !!recordId,
  });
}

export function useExerciseProgress(exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.exerciseProgress(exerciseId),
    queryFn: () => progressService.getExerciseProgress(exerciseId),
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMuscleBalance(params?: { weeks?: number; mesocycle_id?: string }) {
  return useQuery({
    queryKey: queryKeys.muscleBalance(params),
    queryFn: () => analyticsService.getMuscleBalance(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMesocycles(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.mesocycles(params),
    queryFn: () => mesocycleService.getMesocycles(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useMesocycle(mesocycleId: string) {
  return useQuery({
    queryKey: queryKeys.mesocycle(mesocycleId),
    queryFn: () => mesocycleService.getMesocycle(mesocycleId),
    enabled: !!mesocycleId,
  });
}

export function useMesocycleAnalytics(mesocycleId: string) {
  return useQuery({
    queryKey: queryKeys.mesocycleAnalytics(mesocycleId),
    queryFn: () => mesocycleService.getMesocycleAnalytics(mesocycleId),
    enabled: !!mesocycleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateMesocycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      goal?: string;
      start_date: string;
      end_date: string;
    }) => mesocycleService.createMesocycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles() });
    },
  });
}

export function useUpdateMesocycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mesocycleId,
      data,
    }: {
      mesocycleId: string;
      data: Partial<{
        name: string;
        description: string;
        goal: string;
        status: "planned" | "active" | "completed" | "cancelled";
      }>;
    }) => mesocycleService.updateMesocycle(mesocycleId, data),
    onSuccess: (_, { mesocycleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycle(mesocycleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles() });
    },
  });
}

export function useDeleteMesocycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mesocycleId: string) => mesocycleService.deleteMesocycle(mesocycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles() });
    },
  });
}
