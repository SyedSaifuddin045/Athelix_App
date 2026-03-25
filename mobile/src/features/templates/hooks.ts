import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/api/queryKeys";
import {
  createWorkoutTemplate,
  createWorkoutTemplateExercise,
  deleteWorkoutTemplate,
  deleteWorkoutTemplateExercise,
  getWorkoutTemplateDetail,
  listWorkoutTemplateExercises,
  listWorkoutTemplates,
  updateWorkoutTemplate,
  updateWorkoutTemplateExercise,
} from "./api";

export function useWorkoutTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.templates.list,
    queryFn: listWorkoutTemplates,
    staleTime: 60 * 1000,
  });
}

export function useWorkoutTemplateDetailQuery(templateId: number | undefined) {
  return useQuery({
    queryKey: templateId ? queryKeys.templates.detail(templateId) : ["templates", "detail", "missing"],
    queryFn: () => getWorkoutTemplateDetail(templateId!),
    enabled: templateId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useWorkoutTemplateExercisesQuery(templateId: number | undefined) {
  return useQuery({
    queryKey: templateId
      ? queryKeys.templates.exercises(templateId)
      : ["templates", "exercises", "missing"],
    queryFn: () => listWorkoutTemplateExercises(templateId!),
    enabled: templateId !== undefined,
    staleTime: 60 * 1000,
  });
}

export function useCreateWorkoutTemplateMutation() {
  return useMutation({
    mutationFn: createWorkoutTemplate,
  });
}

export function useUpdateWorkoutTemplateMutation() {
  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: number;
      payload: Parameters<typeof updateWorkoutTemplate>[1];
    }) => updateWorkoutTemplate(templateId, payload),
  });
}

export function useDeleteWorkoutTemplateMutation() {
  return useMutation({
    mutationFn: deleteWorkoutTemplate,
  });
}

export function useCreateWorkoutTemplateExerciseMutation() {
  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: number;
      payload: Parameters<typeof createWorkoutTemplateExercise>[1];
    }) => createWorkoutTemplateExercise(templateId, payload),
  });
}

export function useUpdateWorkoutTemplateExerciseMutation() {
  return useMutation({
    mutationFn: ({
      templateId,
      templateExerciseId,
      payload,
    }: {
      templateId: number;
      templateExerciseId: number;
      payload: Parameters<typeof updateWorkoutTemplateExercise>[2];
    }) => updateWorkoutTemplateExercise(templateId, templateExerciseId, payload),
  });
}

export function useDeleteWorkoutTemplateExerciseMutation() {
  return useMutation({
    mutationFn: ({
      templateId,
      templateExerciseId,
    }: {
      templateId: number;
      templateExerciseId: number;
    }) => deleteWorkoutTemplateExercise(templateId, templateExerciseId),
  });
}
