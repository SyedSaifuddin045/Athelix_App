import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionService, templateService } from "../api/services";
import { queryKeys } from "./useUser";
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  CreateTemplateExerciseRequest,
  UpdateTemplateExerciseRequest,
} from "../api/types";

export function useWorkoutSessions(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.sessions(params),
    queryFn: () => sessionService.getSessions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useWorkoutSession(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: () => sessionService.getSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest) => sessionService.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: UpdateSessionRequest;
    }) => sessionService.updateSession(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

export function useWorkoutTemplates(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.templates(params),
    queryFn: () => templateService.getTemplates(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useWorkoutTemplate(templateId: string) {
  return useQuery({
    queryKey: queryKeys.template(templateId),
    queryFn: () => templateService.getTemplate(templateId),
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      templateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: { name?: string; description?: string };
    }) => templateService.updateTemplate(templateId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => templateService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    },
  });
}

export function useAddTemplateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: CreateTemplateExerciseRequest;
    }) => templateService.addExercise(templateId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
    },
  });
}

export function useUpdateTemplateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      exerciseId,
      data,
    }: {
      templateId: string;
      exerciseId: string;
      data: UpdateTemplateExerciseRequest;
    }) => templateService.updateExercise(templateId, exerciseId, data),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
    },
  });
}

export function useDeleteTemplateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, exerciseId }: { templateId: string; exerciseId: string }) =>
      templateService.deleteExercise(templateId, exerciseId),
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.template(templateId) });
    },
  });
}
