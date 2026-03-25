import { api } from "../../lib/api/client";
import {
  mesocycleAnalyticsSchema,
  mesocycleCreatePayloadSchema,
  mesocycleDetailSchema,
  mesocycleSchema,
  mesocycleUpdatePayloadSchema,
  type CreateMesocyclePayload,
  type Mesocycle,
  type MesocycleAnalytics,
  type MesocycleDetail,
  type UpdateMesocyclePayload,
} from "./schemas";

export interface MesocycleAnalyticsSearchParams {
  formula?: string;
}

export async function listMesocycles(): Promise<Mesocycle[]> {
  const response = await api.get("/mesocycles");
  return mesocycleSchema.array().parse(response.data);
}

export async function createMesocycle(
  payload: CreateMesocyclePayload,
): Promise<Mesocycle> {
  const response = await api.post(
    "/mesocycles",
    mesocycleCreatePayloadSchema.parse(payload),
  );
  return mesocycleSchema.parse(response.data);
}

export async function getMesocycle(
  mesocycleId: number,
): Promise<MesocycleDetail> {
  const response = await api.get(`/mesocycles/${mesocycleId}`);
  return mesocycleDetailSchema.parse(response.data);
}

export async function updateMesocycle(
  mesocycleId: number,
  payload: UpdateMesocyclePayload,
): Promise<Mesocycle> {
  const response = await api.patch(
    `/mesocycles/${mesocycleId}`,
    mesocycleUpdatePayloadSchema.parse(payload),
  );
  return mesocycleSchema.parse(response.data);
}

export async function deleteMesocycle(mesocycleId: number): Promise<void> {
  await api.delete(`/mesocycles/${mesocycleId}`);
}

export async function getMesocycleAnalytics(
  mesocycleId: number,
  params: MesocycleAnalyticsSearchParams = {},
): Promise<MesocycleAnalytics> {
  const response = await api.get(`/mesocycles/${mesocycleId}/analytics`, {
    params,
  });
  return mesocycleAnalyticsSchema.parse(response.data);
}
