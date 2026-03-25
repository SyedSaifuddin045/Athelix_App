import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  getExerciseProgress,
  listPersonalRecords,
  type ExerciseProgressSearchParams,
  type PersonalRecordSearchParams,
} from "./api";

export function usePersonalRecordsQuery(
  params: PersonalRecordSearchParams = {},
) {
  const queryParams = params as Record<string, unknown>;
  return useQuery({
    queryKey: queryKeys.progress.personalRecords(queryParams),
    queryFn: () => listPersonalRecords(params),
    staleTime: 60 * 1000,
  });
}

export function useExerciseProgressQuery(
  exerciseId: string | undefined,
  params: ExerciseProgressSearchParams = {},
) {
  const queryParams = params as Record<string, unknown>;
  return useQuery({
    queryKey: exerciseId
      ? queryKeys.progress.exercise(exerciseId, queryParams)
      : ["progress", "exercise", "missing"],
    queryFn: () => getExerciseProgress(exerciseId!, params),
    enabled: Boolean(exerciseId),
    staleTime: 60 * 1000,
  });
}
