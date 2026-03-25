import { useQuery } from "@tanstack/react-query";
import { getAppConfig } from "./api";
import { queryKeys } from "../../lib/api/queryKeys";

export function useAppConfigQuery() {
  return useQuery({
    queryKey: queryKeys.meta.appConfig,
    queryFn: getAppConfig,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
