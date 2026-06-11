import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient } from "@tanstack/react-query";
import { createWrapper } from "../test/test-utils";

jest.mock("../api/endpoints/meta/meta");
jest.mock("../api/endpoints/auth/auth");
jest.mock("../api/endpoints/users/users");
jest.mock("../api/endpoints/workout-sessions/workout-sessions");
jest.mock("../api/endpoints/workout-templates/workout-templates");
jest.mock("../api/endpoints/exercises/exercises");
jest.mock("../api/endpoints/mesocycles/mesocycles");
jest.mock("../api/endpoints/personal-records/personal-records");
jest.mock("../api/endpoints/progress/progress");
jest.mock("../api/endpoints/analytics/analytics");
jest.mock("../api/endpoints/health/health");

import { getAppConfigMetaAppConfigGet } from "../api/endpoints/meta/meta";
import { getMeAuthMeGet } from "../api/endpoints/auth/auth";
import {
  getCurrentUserOverviewUsersMeOverviewGet,
  getCurrentUserProfileUsersMeProfileGet,
} from "../api/endpoints/users/users";
import { listWorkoutSessionsWorkoutSessionsGet } from "../api/endpoints/workout-sessions/workout-sessions";
import { listWorkoutTemplatesWorkoutTemplatesGet } from "../api/endpoints/workout-templates/workout-templates";
import { listExercisesExercisesGet } from "../api/endpoints/exercises/exercises";
import { listMesocyclesMesocyclesGet } from "../api/endpoints/mesocycles/mesocycles";
import {
  getWorkoutTemplateWorkoutTemplatesTemplateIdGet,
} from "../api/endpoints/workout-templates/workout-templates";
import { listPersonalRecordsPersonalRecordsGet } from "../api/endpoints/personal-records/personal-records";
import { getExerciseProgressProgressExerciseIdGet } from "../api/endpoints/progress/progress";
import { getMuscleBalanceReportAnalyticsMuscleBalanceGet } from "../api/endpoints/analytics/analytics";

import { ApiError } from "../api/client";
import type {
  AppConfigResponse,
  UserResponse,
  UserOverviewResponse,
  UserProfileResponse,
  WorkoutTemplateResponse,
  WorkoutSessionResponse,
  MesocycleResponse,
  PersonalRecordResponse,
  ExerciseListResponse,
  ExerciseProgressResponse,
  MuscleBalanceReportResponse,
} from "../api/model";

import {
  useAppConfigQuery,
  useAuthMeQuery,
  useOverviewQuery,
  useProfileQuery,
  useTemplatesQuery,
  useSessionsQuery,
  useExercisesQuery,
  useMesocyclesQuery,
  useTemplateDetailQuery,
  usePersonalRecordsQuery,
  useExerciseProgressQuery,
  useMuscleBalanceQuery,
} from "../api/queries";

const mockHeaders = new Headers();

const mockAppConfig: AppConfigResponse = {
  app_name: "Athelix",
  version: "1.0.0",
  environment: "test",
  auth: { token_type: "bearer", access_token_expires_in: 3600, refresh_token_expires_in: 86400 },
  docs: { docs_url: null, redoc_url: null, openapi_url: null },
  features: {
    auth: true, user_profiles: true, body_weight_tracking: true,
    exercises: true, workout_templates: true, workout_sessions: true,
    personal_records: true, progress_tracking: true, mesocycles: true,
    deload_suggestions: true, muscle_balance_reports: true,
  },
  supported_values: {
    e1rm_formulas: ["epley", "brzycki"],
    personal_record_types: ["weight", "volume", "reps"],
    mesocycle_goals: ["Hypertrophy", "Strength", "Endurance"],
  },
};

const mockUser: UserResponse = {
  id: 1, username: "testuser", email: "test@example.com",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

const mockOverview: UserOverviewResponse = {
  user: mockUser,
  has_profile: true,
  profile: { id: 1, user_id: 1, display_name: "Test User", date_of_birth: null, gender: null, height_cm: null, weight_kg: null, fitness_level: null, preferred_unit: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  latest_body_weight_log: null,
  active_mesocycle: null,
  latest_completed_session: null,
  recent_personal_records: [],
  workout_streaks: { current_daily_streak: 5, longest_daily_streak: 10, current_weekly_streak: 2, longest_weekly_streak: 4 },
  stats: { total_workout_templates: 3, total_sessions: 20, completed_sessions: 15, personal_record_count: 5, tracked_exercises_count: 10 },
  weekly_activity: [{ day: "Mon", value: 1 }, { day: "Tue", value: 0 }],
};

const mockProfile: UserProfileResponse = {
  id: 1, user_id: 1, display_name: "Test User", date_of_birth: null, gender: null,
  height_cm: 180, weight_kg: 80, fitness_level: "intermediate", preferred_unit: "kg",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

const mockSession: WorkoutSessionResponse = {
  id: 1, user_id: 1, template_id: null, mesocycle_id: null, name: "Morning Push",
  started_at: "2026-05-20T09:00:00Z", finished_at: "2026-05-20T10:00:00Z",
  perceived_exertion: null, mood: null, location: null, notes: null,
  is_completed: true, duration_minutes: 60, total_sets: 12, total_volume: 4500, prs_count: 1,
};

const mockTemplate: WorkoutTemplateResponse = {
  id: 1, user_id: 1, name: "Push Day A", description: "Chest and triceps",
  is_public: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-05-15T12:00:00Z",
};

const mockExercises: ExerciseListResponse = {
  items: [
    { id: "ex1", name: "Bench Press", target: "Chest", body_part: "Upper Body", equipment: "Barbell", gif_url: null },
    { id: "ex2", name: "Squat", target: "Quads", body_part: "Legs", equipment: "Barbell", gif_url: null },
  ],
  total: 2, limit: 20, offset: 0,
};

const mockMesocycle: MesocycleResponse = {
  id: 1, user_id: 1, name: "Summer Block", goal: "Hypertrophy",
  started_on: "2026-05-01", ended_on: null, weeks: 8, notes: null, created_at: "2026-01-01T00:00:00Z",
};

const mockPR: PersonalRecordResponse = {
  id: 1, user_id: 1, exercise_id: "ex1", record_type: "weight", value: 100,
  achieved_on: "2026-05-20", session_id: null, set_id: null, notes: null, created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useAppConfigQuery", () => {
  it("fetches and returns app config", async () => {
    (getAppConfigMetaAppConfigGet as jest.Mock).mockResolvedValue({ data: mockAppConfig, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useAppConfigQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAppConfig);
    expect(getAppConfigMetaAppConfigGet).toHaveBeenCalledTimes(1);
  });

  it("does not refetch (staleTime Infinity)", async () => {
    (getAppConfigMetaAppConfigGet as jest.Mock).mockResolvedValue({ data: mockAppConfig, status: 200, headers: mockHeaders });
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(() => useAppConfigQuery(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAppConfigMetaAppConfigGet).toHaveBeenCalledTimes(1);
    rerender(undefined);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getAppConfigMetaAppConfigGet).toHaveBeenCalledTimes(1);
  });

  it("handles fetch error", async () => {
    (getAppConfigMetaAppConfigGet as jest.Mock).mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAppConfigQuery(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useAuthMeQuery", () => {
  it("fetches when enabled", async () => {
    (getMeAuthMeGet as jest.Mock).mockResolvedValue({ data: mockUser, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useAuthMeQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useAuthMeQuery(false), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(getMeAuthMeGet).not.toHaveBeenCalled();
  });
});

describe("useOverviewQuery", () => {
  it("fetches user overview when enabled", async () => {
    (getCurrentUserOverviewUsersMeOverviewGet as jest.Mock).mockResolvedValue({ data: mockOverview, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useOverviewQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockOverview);
    expect(result.current.data?.user.username).toBe("testuser");
    expect(result.current.data?.workout_streaks.current_daily_streak).toBe(5);
  });
});

describe("useProfileQuery", () => {
  it("returns profile data when profile exists", async () => {
    (getCurrentUserProfileUsersMeProfileGet as jest.Mock).mockResolvedValue({ data: mockProfile, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useProfileQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfile);
  });

  it("returns null on 404 (no profile)", async () => {
    const notFoundError = new ApiError("Not found", 404);
    (getCurrentUserProfileUsersMeProfileGet as jest.Mock).mockRejectedValue(notFoundError);
    const { result } = renderHook(() => useProfileQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("re-throws non-404 errors", async () => {
    const serverError = new ApiError("Server error", 500);
    (getCurrentUserProfileUsersMeProfileGet as jest.Mock).mockRejectedValue(serverError);
    const { result } = renderHook(() => useProfileQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useSessionsQuery", () => {
  it("fetches sessions list", async () => {
    (listWorkoutSessionsWorkoutSessionsGet as jest.Mock).mockResolvedValue({ data: [mockSession], status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useSessionsQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Morning Push");
  });
});

describe("useTemplatesQuery", () => {
  it("fetches templates list", async () => {
    (listWorkoutTemplatesWorkoutTemplatesGet as jest.Mock).mockResolvedValue({ data: [mockTemplate], status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useTemplatesQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Push Day A");
  });
});

describe("useExercisesQuery", () => {
  it("fetches exercises with params", async () => {
    (listExercisesExercisesGet as jest.Mock).mockResolvedValue({ data: mockExercises, status: 200, headers: mockHeaders });
    const params = { target: "Chest", limit: 20 };
    const { result } = renderHook(() => useExercisesQuery(params, true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(listExercisesExercisesGet).toHaveBeenCalledWith(params);
  });

  it("keeps previous data when params change", async () => {
    (listExercisesExercisesGet as jest.Mock).mockResolvedValue({ data: mockExercises, status: 200, headers: mockHeaders });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const wrapper = createWrapper({ queryClient: qc });
    const { result, rerender } = renderHook(
      (props: { params: { target?: string } }) => useExercisesQuery(props.params, true),
      { wrapper, initialProps: { params: { target: "Chest" } } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);

    (listExercisesExercisesGet as jest.Mock).mockResolvedValue({
      data: { items: [{ id: "ex3", name: "Deadlift", target: "Back", body_part: "Full Body", equipment: "Barbell", gif_url: null }], total: 1, limit: 20, offset: 0 },
      status: 200, headers: mockHeaders,
    });

    rerender({ params: { target: "Back" } });
    expect(result.current.isPlaceholderData).toBe(true);
  });
});

describe("useMesocyclesQuery", () => {
  it("fetches mesocycles list", async () => {
    (listMesocyclesMesocyclesGet as jest.Mock).mockResolvedValue({ data: [mockMesocycle], status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useMesocyclesQuery(true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].name).toBe("Summer Block");
  });
});

describe("useTemplateDetailQuery", () => {
  it("fetches template detail when id is provided", async () => {
    (getWorkoutTemplateWorkoutTemplatesTemplateIdGet as jest.Mock).mockResolvedValue({ data: mockTemplate, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useTemplateDetailQuery(1, true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTemplate);
  });

  it("does not fetch when id is null", () => {
    const { result } = renderHook(() => useTemplateDetailQuery(null, true), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(getWorkoutTemplateWorkoutTemplatesTemplateIdGet).not.toHaveBeenCalled();
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useTemplateDetailQuery(1, false), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(getWorkoutTemplateWorkoutTemplatesTemplateIdGet).not.toHaveBeenCalled();
  });
});

describe("usePersonalRecordsQuery", () => {
  it("fetches personal records with params", async () => {
    (listPersonalRecordsPersonalRecordsGet as jest.Mock).mockResolvedValue({ data: [mockPR], status: 200, headers: mockHeaders });
    const params = { record_type: "weight" };
    const { result } = renderHook(() => usePersonalRecordsQuery(params, true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(listPersonalRecordsPersonalRecordsGet).toHaveBeenCalledWith(params);
  });
});

describe("useExerciseProgressQuery", () => {
  it("fetches exercise progress when id is provided", async () => {
    const mockProgress: ExerciseProgressResponse = {
      exercise_id: "ex1", exercise_name: "Bench Press", default_formula: "epley",
      e1rm_history: [], volume_history: [], weekly_volume_history: [],
      progressive_overload: [],
      workout_streaks: { current_daily_streak: 5, longest_daily_streak: 10, current_weekly_streak: 2, longest_weekly_streak: 4 },
    };
    (getExerciseProgressProgressExerciseIdGet as jest.Mock).mockResolvedValue({ data: mockProgress, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useExerciseProgressQuery("ex1", { formula: "epley" }, true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.exercise_name).toBe("Bench Press");
    expect(getExerciseProgressProgressExerciseIdGet).toHaveBeenCalledWith("ex1", { formula: "epley" });
  });

  it("does not fetch without exercise id", () => {
    const { result } = renderHook(() => useExerciseProgressQuery(undefined, { formula: "epley" }, true), { wrapper: createWrapper() });
    expect(result.current.isPending).toBe(true);
    expect(getExerciseProgressProgressExerciseIdGet).not.toHaveBeenCalled();
  });
});

describe("useMuscleBalanceQuery", () => {
  it("fetches muscle balance report", async () => {
    const mockReport: MuscleBalanceReportResponse = {
      weeks_in_scope: 4,
      items: [{
        muscle_group: "Chest", weekly_sets: 12, average_weekly_sets: 10,
        score: 80, status: "balanced", recommendation: "Maintain",
        exercises: [{ exercise_name: "Bench Press", completed_sets: 8, average_weekly_sets: 6 }],
      }],
    };
    (getMuscleBalanceReportAnalyticsMuscleBalanceGet as jest.Mock).mockResolvedValue({ data: mockReport, status: 200, headers: mockHeaders });
    const { result } = renderHook(() => useMuscleBalanceQuery({ weeks: 4 }, true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].muscle_group).toBe("Chest");
  });
});
