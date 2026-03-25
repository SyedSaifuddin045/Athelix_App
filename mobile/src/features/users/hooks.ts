import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  createBodyWeightLog,
  deleteBodyWeightLog,
  getCurrentUser,
  getCurrentUserOverview,
  getCurrentUserProfile,
  listBodyWeightLogs,
  updateBodyWeightLog,
  updateCurrentUser,
} from "./api";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: getCurrentUser,
    staleTime: 30 * 1000,
  });
}

export function useOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.users.overview,
    queryFn: getCurrentUserOverview,
    staleTime: 30 * 1000,
  });
}

export function useCurrentProfileQuery() {
  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: getCurrentUserProfile,
    staleTime: 30 * 1000,
  });
}

export function useBodyWeightLogsQuery() {
  return useQuery({
    queryKey: queryKeys.users.bodyWeightLogs,
    queryFn: listBodyWeightLogs,
    staleTime: 60 * 1000,
  });
}

export function useUpdateCurrentUserMutation() {
  return useMutation({
    mutationFn: updateCurrentUser,
  });
}

export function useCreateBodyWeightLogMutation() {
  return useMutation({
    mutationFn: createBodyWeightLog,
  });
}

export function useUpdateBodyWeightLogMutation() {
  return useMutation({
    mutationFn: ({
      logId,
      payload,
    }: {
      logId: number;
      payload: Parameters<typeof updateBodyWeightLog>[1];
    }) => updateBodyWeightLog(logId, payload),
  });
}

export function useDeleteBodyWeightLogMutation() {
  return useMutation({
    mutationFn: deleteBodyWeightLog,
  });
}
