import { api } from "../../lib/api/client";
import {
  exerciseProgressSchema,
  personalRecordSchema,
  type ExerciseProgress,
  type PersonalRecord,
} from "./schemas";

export interface PersonalRecordSearchParams {
  exercise_id?: string;
  record_type?: string;
}

export interface ExerciseProgressSearchParams {
  formula?: string;
  reference_date?: string;
}

export async function listPersonalRecords(
  params: PersonalRecordSearchParams = {},
): Promise<PersonalRecord[]> {
  const response = await api.get("/personal-records", {
    params,
  });
  return personalRecordSchema.array().parse(response.data);
}

export async function getExerciseProgress(
  exerciseId: string,
  params: ExerciseProgressSearchParams = {},
): Promise<ExerciseProgress> {
  const response = await api.get(`/progress/${exerciseId}`, {
    params,
  });
  return exerciseProgressSchema.parse(response.data);
}
