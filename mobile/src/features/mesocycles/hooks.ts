import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  createMesocycle,
  deleteMesocycle,
  getMesocycle,
  getMesocycleAnalytics,
  listMesocycles,
  updateMesocycle,
  type MesocycleAnalyticsSearchParams,
} from "./api";

export function useMesocyclesQuery() {
  return useQuery({
    queryKey: queryKeys.mesocycles.list,
    queryFn: listMesocycles,
    staleTime: 60 * 1000,
  });
}

export function useMesocycleDetailQuery(mesocycleId: number | undefined) {
  return useQuery({
    queryKey: mesocycleId
      ? queryKeys.mesocycles.detail(mesocycleId)
      : ["mesocycles", "detail", "missing"],
    queryFn: () => getMesocycle(mesocycleId!),
    enabled: mesocycleId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useMesocycleAnalyticsQuery(
  mesocycleId: number | undefined,
  params: MesocycleAnalyticsSearchParams = {},
) {
  const queryParams = params as Record<string, unknown>;
  return useQuery({
    queryKey: mesocycleId
      ? queryKeys.mesocycles.analytics(mesocycleId, queryParams)
      : ["mesocycles", "analytics", "missing"],
    queryFn: () => getMesocycleAnalytics(mesocycleId!, params),
    enabled: mesocycleId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useCreateMesocycleMutation() {
  return useMutation({
    mutationFn: createMesocycle,
  });
}

export function useUpdateMesocycleMutation() {
  return useMutation({
    mutationFn: ({
      mesocycleId,
      payload,
    }: {
      mesocycleId: number;
      payload: Parameters<typeof updateMesocycle>[1];
    }) => updateMesocycle(mesocycleId, payload),
  });
}

export function useDeleteMesocycleMutation() {
  return useMutation({
    mutationFn: deleteMesocycle,
  });
}
