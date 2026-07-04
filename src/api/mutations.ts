import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteWorkoutTemplateWorkoutTemplatesTemplateIdDelete } from "./endpoints/workout-templates/workout-templates";
import {
  createMesocycleMesocyclesPost,
  deleteMesocycleMesocyclesMesocycleIdDelete,
} from "./endpoints/mesocycles/mesocycles";
import {
  createBodyWeightLogUsersMeBodyWeightLogsPost,
  deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete,
  upsertCurrentUserProfileUsersMeProfilePut,
  updateCurrentUserUsersMePatch,
} from "./endpoints/users/users";
import { createWorkoutSessionWorkoutSessionsPost } from "./endpoints/workout-sessions/workout-sessions";
import type {
  BodyWeightLogCreate,
  MesocycleCreate,
  MesocycleResponse,
  UserProfileUpdate,
  UserUpdate,
  WorkoutSessionCreate,
  WorkoutSessionResponse,
} from "./model";
import { queryKeys } from "./queryKeys";

export function useDeleteTemplate(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => deleteWorkoutTemplateWorkoutTemplatesTemplateIdDelete(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteMesocycle(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mesocycleId: number) => deleteMesocycleMesocyclesMesocycleIdDelete(mesocycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
  });
}

export function useCreateBodyWeightLog(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BodyWeightLogCreate) => createBodyWeightLogUsersMeBodyWeightLogsPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteBodyWeightLog(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: number) => deleteBodyWeightLogUsersMeBodyWeightLogsLogIdDelete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
  });
}

export function useCreateMesocycle(options?: { onSuccess?: (data: MesocycleResponse) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MesocycleCreate) => {
      const response = await createMesocycleMesocyclesPost(data);
      return response.data as MesocycleResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mesocycles });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.(data);
    },
  });
}

export function useSaveProfile(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserProfileUpdate) => upsertCurrentUserProfileUsersMeProfilePut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
  });
}

export function useSaveAccount(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdate) => updateCurrentUserUsersMePatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
  });
}

export function useStartSession(options?: { onSuccess?: (data: WorkoutSessionResponse) => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WorkoutSessionCreate) => {
      const response = await createWorkoutSessionWorkoutSessionsPost(data);
      return response.data as WorkoutSessionResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
      options?.onSuccess?.(data);
    },
  });
}
