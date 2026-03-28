import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exerciseService, setService } from "../api/services";
import { queryKeys } from "./useUser";
import type { CreateSetRequest, UpdateSetRequest } from "../api/types";

export function useExerciseFilters() {
  return useQuery({
    queryKey: queryKeys.exerciseFilters,
    queryFn: exerciseService.getFilters,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useExercises(params?: {
  q?: string;
  body_part?: string;
  equipment?: string;
  target?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: queryKeys.exercises(params),
    queryFn: () => exerciseService.getExercises(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useExercise(exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.exercise(exerciseId),
    queryFn: () => exerciseService.getExercise(exerciseId),
  });
}

export function useSets(sessionId: string) {
  return useQuery({
    queryKey: ["sets", sessionId] as const,
    queryFn: () => setService.getSets(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: CreateSetRequest }) =>
      setService.createSet(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["sets", sessionId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
    },
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      setId,
      data,
    }: {
      sessionId: string;
      setId: string;
      data: UpdateSetRequest;
    }) => setService.updateSet(sessionId, setId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["sets", sessionId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, setId }: { sessionId: string; setId: string }) =>
      setService.deleteSet(sessionId, setId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ["sets", sessionId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
    },
  });
}
