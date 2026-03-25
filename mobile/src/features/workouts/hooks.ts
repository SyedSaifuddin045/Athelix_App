import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import { createWorkoutSession, deleteWorkoutSession, getWorkoutSession, listWorkoutSessions } from "./api";
import { listQueuedWorkoutActionsForSession } from "./queue";

export function useCreateWorkoutSessionMutation() {
  return useMutation({
    mutationFn: createWorkoutSession,
  });
}

export function useWorkoutSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.workouts.list,
    queryFn: listWorkoutSessions,
    staleTime: 60 * 1000,
  });
}

export function useWorkoutSessionQuery(sessionId: number | undefined) {
  return useQuery({
    queryKey: sessionId ? queryKeys.workouts.detail(sessionId) : ["workouts", "detail", "missing"],
    queryFn: () => getWorkoutSession(sessionId!),
    enabled: sessionId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useQueuedWorkoutSessionActionsQuery(sessionId: number | undefined) {
  return useQuery({
    queryKey: sessionId ? queryKeys.workouts.queued(sessionId) : ["workouts", "queued", "missing"],
    queryFn: () => listQueuedWorkoutActionsForSession(sessionId!),
    enabled: sessionId !== undefined,
    staleTime: 0,
  });
}

export function useDeleteWorkoutSessionMutation() {
  return useMutation({
    mutationFn: deleteWorkoutSession,
  });
}
