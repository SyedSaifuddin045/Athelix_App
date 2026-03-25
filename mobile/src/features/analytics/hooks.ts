import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import { getMuscleBalanceReport, type MuscleBalanceSearchParams } from "./api";

export function useMuscleBalanceQuery(
  params: MuscleBalanceSearchParams = {},
) {
  const queryParams = params as Record<string, unknown>;
  return useQuery({
    queryKey: queryKeys.analytics.muscleBalance(queryParams),
    queryFn: () => getMuscleBalanceReport(params),
    staleTime: 60 * 1000,
  });
}
