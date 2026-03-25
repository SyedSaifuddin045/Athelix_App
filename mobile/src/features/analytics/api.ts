import { api } from "../../lib/api/client";
import { muscleBalanceReportSchema, type MuscleBalanceReport } from "./schemas";

export interface MuscleBalanceSearchParams {
  weeks?: number;
  reference_date?: string;
  mesocycle_id?: number;
}

export async function getMuscleBalanceReport(
  params: MuscleBalanceSearchParams = {},
): Promise<MuscleBalanceReport> {
  const response = await api.get("/analytics/muscle-balance", {
    params,
  });
  return muscleBalanceReportSchema.parse(response.data);
}
