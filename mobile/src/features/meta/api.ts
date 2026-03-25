import { api } from "../../lib/api/client";
import { appConfigSchema, type AppConfig } from "./schemas";

export async function getAppConfig(): Promise<AppConfig> {
  const response = await api.get("/meta/app-config");
  return appConfigSchema.parse(response.data);
}
