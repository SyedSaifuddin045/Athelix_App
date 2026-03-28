import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exerciseService } from "../api/services";
import { queryKeys } from "./useUser";
import type { Exercise } from "../api/types";

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
    enabled: !!exerciseId,
  });
}

export function useExercisesByIds(exerciseIds: string[]) {
  return useQuery({
    queryKey: ["exercises", "byIds", exerciseIds.sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        exerciseIds.map((id) => exerciseService.getExercise(id).catch(() => null))
      );
      return results.filter((r): r is Exercise => r !== null);
    },
    enabled: exerciseIds.length > 0,
  });
}
