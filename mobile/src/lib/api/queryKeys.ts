export const queryKeys = {
  meta: {
    appConfig: ["meta", "app-config"] as const,
  },
  users: {
    me: ["users", "me"] as const,
    overview: ["users", "overview"] as const,
    profile: ["users", "profile"] as const,
    bodyWeightLogs: ["users", "body-weight-logs"] as const,
    bodyWeightLog: (logId: number) =>
      ["users", "body-weight-logs", logId] as const,
  },
  exercises: {
    filters: ["exercises", "filters"] as const,
    list: (filters: Record<string, unknown>) =>
      ["exercises", "list", filters] as const,
    detail: (exerciseId: string) =>
      ["exercises", "detail", exerciseId] as const,
  },
  templates: {
    list: ["templates", "list"] as const,
    detail: (templateId: number) =>
      ["templates", "detail", templateId] as const,
    exercises: (templateId: number) =>
      ["templates", "detail", templateId, "exercises"] as const,
  },
  workouts: {
    list: ["workouts", "list"] as const,
    detail: (sessionId: number) =>
      ["workouts", "detail", sessionId] as const,
    queued: (sessionId: number) =>
      ["workouts", "queued", sessionId] as const,
  },
  progress: {
    personalRecords: (filters: Record<string, unknown>) =>
      ["progress", "personal-records", filters] as const,
    exercise: (exerciseId: string, params: Record<string, unknown>) =>
      ["progress", "exercise", exerciseId, params] as const,
  },
  analytics: {
    muscleBalance: (params: Record<string, unknown>) =>
      ["analytics", "muscle-balance", params] as const,
  },
  mesocycles: {
    list: ["mesocycles", "list"] as const,
    detail: (mesocycleId: number) =>
      ["mesocycles", "detail", mesocycleId] as const,
    analytics: (mesocycleId: number, params: Record<string, unknown>) =>
      ["mesocycles", "analytics", mesocycleId, params] as const,
  },
} as const;
