import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, authService, metaService } from "../api/services";
import type { UserProfile } from "../api/types";
import { useAuthStore } from "../store";

export const queryKeys = {
  meta: ["meta"] as const,
  appConfig: ["meta", "appConfig"] as const,
  user: ["user"] as const,
  profile: ["profile"] as const,
  overview: ["overview"] as const,
  bodyWeightLogs: (params?: { limit?: number; offset?: number }) =>
    ["bodyWeightLogs", params] as const,
  exercises: (params?: Record<string, unknown>) => ["exercises", params] as const,
  exerciseFilters: ["exerciseFilters"] as const,
  exercise: (id: string) => ["exercise", id] as const,
  templates: (params?: { limit?: number; offset?: number }) =>
    ["templates", params] as const,
  template: (id: string) => ["template", id] as const,
  sessions: (params?: { limit?: number; offset?: number }) =>
    ["sessions", params] as const,
  session: (id: string) => ["session", id] as const,
  records: (params?: Record<string, unknown>) => ["records", params] as const,
  exerciseProgress: (exerciseId: string) => ["exerciseProgress", exerciseId] as const,
  muscleBalance: (params?: Record<string, unknown>) => ["muscleBalance", params] as const,
  mesocycles: (params?: { limit?: number; offset?: number }) =>
    ["mesocycles", params] as const,
  mesocycle: (id: string) => ["mesocycle", id] as const,
  mesocycleAnalytics: (id: string) => ["mesocycleAnalytics", id] as const,
};

export function useAppConfig() {
  return useQuery({
    queryKey: queryKeys.appConfig,
    queryFn: metaService.getAppConfig,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: authService.me,
    enabled: useAuthStore((state) => state.isAuthenticated),
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: userService.getProfile,
    enabled: useAuthStore((state) => state.isAuthenticated),
  });
}

export function useUserOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: userService.getOverview,
    enabled: useAuthStore((state) => state.isAuthenticated),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useBodyWeightLogs(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.bodyWeightLogs(params),
    queryFn: () => userService.getBodyWeightLogs(params),
    enabled: useAuthStore((state) => state.isAuthenticated),
  });
}

export function useCreateBodyWeightLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { weight: number; note?: string }) =>
      userService.createBodyWeightLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useUpdateBodyWeightLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, data }: { logId: string; data: { weight?: number; note?: string } }) =>
      userService.updateBodyWeightLog(logId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useDeleteBodyWeightLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => userService.deleteBodyWeightLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyWeightLogs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}
