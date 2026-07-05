import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ApiError, apiFetch } from "./client";
import { getMuscleBalanceReportAnalyticsMuscleBalanceGet } from "./endpoints/analytics/analytics";
import { getMeAuthMeGet } from "./endpoints/auth/auth";
import {
  getExerciseExercisesExerciseIdGet,
  getExerciseFiltersExercisesFiltersGet,
  listExercisesExercisesGet,
} from "./endpoints/exercises/exercises";
import { healthCheckHealthGet } from "./endpoints/health/health";
import { getAppConfigMetaAppConfigGet } from "./endpoints/meta/meta";
import {
  getMesocycleAnalyticsMesocyclesMesocycleIdAnalyticsGet,
  getMesocycleMesocyclesMesocycleIdGet,
  listMesocyclesMesocyclesGet,
} from "./endpoints/mesocycles/mesocycles";
import { listPersonalRecordsPersonalRecordsGet } from "./endpoints/personal-records/personal-records";
import { getExerciseProgressProgressExerciseIdGet } from "./endpoints/progress/progress";
import {
  getCurrentUserDetailsUsersMeGet,
  getCurrentUserOverviewUsersMeOverviewGet,
  getCurrentUserProfileUsersMeProfileGet,
  listBodyWeightLogsUsersMeBodyWeightLogsGet,
} from "./endpoints/users/users";
import {
  getWorkoutSessionWorkoutSessionsSessionIdGet,
  listWorkoutSessionsWorkoutSessionsGet,
} from "./endpoints/workout-sessions/workout-sessions";
import {
  getWorkoutTemplateWorkoutTemplatesTemplateIdGet,
  listWorkoutTemplatesWorkoutTemplatesGet,
} from "./endpoints/workout-templates/workout-templates";
import type {
  ExerciseResponse,
  GetExerciseProgressProgressExerciseIdGetParams,
  GetMesocycleAnalyticsMesocyclesMesocycleIdAnalyticsGetParams,
  GetMuscleBalanceReportAnalyticsMuscleBalanceGetParams,
  ListExercisesExercisesGetParams,
  ListPersonalRecordsPersonalRecordsGetParams,
} from "./model";
import { queryKeys } from "./queryKeys";

type SuccessData<TResponse> = Extract<TResponse, { status: 200 | 201 | 204 }> extends { data: infer TData }
  ? TData
  : never;

function dataOf<TResponse extends { status: number; data: unknown }>(response: TResponse): SuccessData<TResponse> {
  return response.data as SuccessData<TResponse>;
}

export function useAppConfigQuery() {
  return useQuery({
    queryKey: queryKeys.appConfig,
    queryFn: async () => dataOf(await getAppConfigMetaAppConfigGet()),
    staleTime: Infinity,
  });
}

export function useHealthQuery(enabled = false) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => dataOf(await healthCheckHealthGet()),
    enabled,
  });
}

export function useAuthMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: async () => dataOf(await getMeAuthMeGet()),
    enabled,
  });
}

export function useOverviewQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: async () => dataOf(await getCurrentUserOverviewUsersMeOverviewGet()),
    enabled,
  });
}

export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => dataOf(await getCurrentUserDetailsUsersMeGet()),
    enabled,
  });
}

export function useProfileQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        return dataOf(await getCurrentUserProfileUsersMeProfileGet());
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled,
    retry: false,
  });
}

export function useBodyWeightLogsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.bodyWeightLogs,
    queryFn: async () => dataOf(await listBodyWeightLogsUsersMeBodyWeightLogsGet()),
    enabled,
  });
}

export function useExerciseFiltersQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.exerciseFilters,
    queryFn: async () => dataOf(await getExerciseFiltersExercisesFiltersGet()),
    enabled,
    retry: false,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useExercisesQuery(params: ListExercisesExercisesGetParams, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.exercises(params),
    queryFn: async () => dataOf(await listExercisesExercisesGet(params)),
    enabled,
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useAllExercisesQuery(enabled: boolean, equipment?: string, trackedOnly?: boolean, category?: string) {
  return useQuery({
    queryKey: ["exercises", "all", equipment ?? "all", trackedOnly ?? false, category ?? "all"] as const,
    queryFn: async () => {
      const limit = 200;
      let offset = 0;
      const all: ExerciseResponse[] = [];
      const params: ListExercisesExercisesGetParams = {
        limit,
        offset: 0,
        ...(equipment ? { equipment } : {}),
        ...(trackedOnly ? { tracked: true } : {}),
        ...(category ? { category } : {}),
      };

      while (true) {
        params.offset = offset;
        const response = await listExercisesExercisesGet(params);
        const data = dataOf(response);
        all.push(...data.items);
        if (offset + limit >= data.total) break;
        offset += limit;
      }

      return all;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useExerciseDetailQuery(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.exerciseDetail(id),
    queryFn: async () => dataOf(await getExerciseExercisesExerciseIdGet(id ?? "")),
    enabled: enabled && !!id,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useTemplatesQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: async () => dataOf(await listWorkoutTemplatesWorkoutTemplatesGet()),
    enabled,
  });
}

export function useTemplateDetailQuery(id: number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.templateDetail(id),
    queryFn: async () => dataOf(await getWorkoutTemplateWorkoutTemplatesTemplateIdGet(id ?? 0)),
    enabled: enabled && !!id,
  });
}

export function useSessionsQuery(enabled: boolean, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.sessions(params),
    queryFn: async () => dataOf(await listWorkoutSessionsWorkoutSessionsGet()),
    enabled,
    staleTime: 30_000,
  });
}

export function useSessionDetailQuery(id: number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.sessionDetail(id),
    queryFn: async () => dataOf(await getWorkoutSessionWorkoutSessionsSessionIdGet(id ?? 0)),
    enabled: enabled && !!id,
  });
}

export function usePersonalRecordsQuery(params: ListPersonalRecordsPersonalRecordsGetParams | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.personalRecords(params),
    queryFn: async () => dataOf(await listPersonalRecordsPersonalRecordsGet(params)),
    enabled,
  });
}

export function useExerciseProgressQuery(
  id: string | undefined,
  params: GetExerciseProgressProgressExerciseIdGetParams | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.exerciseProgress(id, params),
    queryFn: async () => dataOf(await getExerciseProgressProgressExerciseIdGet(id ?? "", params)),
    enabled: enabled && !!id,
    staleTime: 60_000,
  });
}

export function useMuscleBalanceQuery(params: GetMuscleBalanceReportAnalyticsMuscleBalanceGetParams | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.muscleBalance(params),
    queryFn: async () => dataOf(await getMuscleBalanceReportAnalyticsMuscleBalanceGet(params)),
    enabled,
  });
}

export function useMesocyclesQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.mesocycles,
    queryFn: async () => dataOf(await listMesocyclesMesocyclesGet()),
    enabled,
  });
}

export function useMesocycleDetailQuery(id: number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.mesocycleDetail(id),
    queryFn: async () => dataOf(await getMesocycleMesocyclesMesocycleIdGet(id ?? 0)),
    enabled: enabled && !!id,
  });
}

export function useMesocycleAnalyticsQuery(
  id: number | null | undefined,
  params: GetMesocycleAnalyticsMesocyclesMesocycleIdAnalyticsGetParams | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.mesocycleAnalytics(id, params),
    queryFn: async () => dataOf(await getMesocycleAnalyticsMesocyclesMesocycleIdAnalyticsGet(id ?? 0, params)),
    enabled: enabled && !!id,
  });
}

export function useNotificationSettingsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.notificationSettings,
    queryFn: async () => {
      const resp = await apiFetch("/devices/settings", { method: "GET" });
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled,
    staleTime: 30000,
  });
}
