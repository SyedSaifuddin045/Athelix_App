import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient } from "@tanstack/react-query";
import { createWrapper } from "../../test/test-utils";
import { queryKeys } from "../../api/queryKeys";
import LoginScreen from "../../screens/LoginScreen";
import HomeScreen from "../../screens/HomeScreen";
import { ProgressHubScreen } from "../../screens/ProgressHubScreen";

const mockUseAuth = jest.fn();
jest.mock("../../auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
};

function mockAuthState(overrides = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: 1, username: "testuser", email: "test@example.com" },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  });
}

describe("LoginScreen", () => {
  beforeEach(() => {
    mockAuthState();
    jest.clearAllMocks();
  });

  it("renders login form", () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );
    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByPlaceholderText("jordan@example.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("shows validation error on empty submit", () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText("Sign In"));
    expect(getByText("Please fill in all fields.")).toBeTruthy();
  });

  it("calls auth.login with credentials and navigates on success", async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockAuthState({ login: mockLogin });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText("jordan@example.com"), "test@test.com");
    fireEvent.changeText(getByPlaceholderText("••••••••"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: "test@test.com", password: "password123" });
      expect(mockNavigation.replace).toHaveBeenCalledWith("MainTabs");
    });
  });

  it("shows error message on failed login", async () => {
    const mockLogin = jest.fn().mockRejectedValue(new Error("Invalid credentials"));
    mockAuthState({ login: mockLogin });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText("jordan@example.com"), "test@test.com");
    fireEvent.changeText(getByPlaceholderText("••••••••"), "wrong");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText("Invalid credentials")).toBeTruthy();
    });
  });

  it("shows loading state during login", async () => {
    const mockLogin = jest.fn().mockImplementation(() => new Promise(() => {}));
    mockAuthState({ login: mockLogin });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );

    fireEvent.changeText(getByPlaceholderText("jordan@example.com"), "test@test.com");
    fireEvent.changeText(getByPlaceholderText("••••••••"), "password");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(getByText("Signing In...")).toBeTruthy();
    });
  });

  it("toggles password visibility", () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />,
    );
    const input = getByPlaceholderText("••••••••");
    expect(input.props?.secureTextEntry).toBe(true);
  });

  it("navigates to register screen", () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    fireEvent.press(getByText("Sign Up"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Register");
  });
});

describe("HomeScreen", () => {
  const mockOverview = {
    user: { id: 1, username: "testuser", email: "test@example.com", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    has_profile: true,
    profile: { id: 1, user_id: 1, display_name: "Test User", date_of_birth: null, gender: null, height_cm: null, weight_kg: null, fitness_level: null, preferred_unit: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    latest_body_weight_log: { id: 1, user_id: 1, weight_kg: 80.5, logged_at: "2026-05-24T10:00:00Z", notes: null },
    active_mesocycle: { id: 1, user_id: 1, name: "Summer Block", goal: "Hypertrophy", started_on: "2026-05-01", ended_on: null, weeks: 8, notes: null, created_at: "2026-01-01T00:00:00Z" },
    latest_completed_session: { id: 1, user_id: 1, template_id: null, mesocycle_id: null, name: "Morning Push", started_at: "2026-05-20T09:00:00Z", finished_at: "2026-05-20T10:00:00Z", perceived_exertion: null, mood: null, location: null, notes: null, is_completed: true, duration_minutes: 60, total_sets: 12, total_volume: 4500, prs_count: 1 },
    recent_personal_records: [{ id: 1, user_id: 1, exercise_id: "Bench Press", record_type: "weight", value: 100, achieved_on: "2026-05-20", session_id: null, set_id: null, notes: null, created_at: "2026-01-01T00:00:00Z" }],
    workout_streaks: { current_daily_streak: 5, longest_daily_streak: 10, current_weekly_streak: 2, longest_weekly_streak: 4 },
    stats: { total_workout_templates: 8, total_sessions: 20, completed_sessions: 15, personal_record_count: 5, tracked_exercises_count: 10 },
    weekly_activity: [{ day: "Mon", value: 1 }, { day: "Tue", value: 0 }, { day: "Wed", value: 1 }, { day: "Thu", value: 0 }, { day: "Fri", value: 1 }, { day: "Sat", value: 1 }, { day: "Sun", value: 1 }],
  };

  function setupQueryClient(data?: typeof mockOverview) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    if (data) {
      qc.setQueryData(queryKeys.overview, data);
    }
    return qc;
  }

  function renderHomeScreen(qc: QueryClient) {
    return render(<HomeScreen navigation={mockNavigation} />, {
      wrapper: createWrapper({ queryClient: qc }),
    });
  }

  beforeEach(() => {
    mockAuthState();
    jest.clearAllMocks();
  });

  it("shows loading state when query is pending", () => {
    const qc = setupQueryClient();
    const { getByText } = renderHomeScreen(qc);
    expect(getByText("Loading your dashboard...")).toBeTruthy();
  });

  it("shows error card when query fails", async () => {
    const qc = setupQueryClient();
    qc.getQueryCache().build(qc, {
      queryKey: queryKeys.overview,
      queryFn: () => Promise.reject(new Error("Network error")),
    });
    qc.refetchQueries({ queryKey: queryKeys.overview });
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => expect(getByText("Could not load data")).toBeTruthy());
    expect(getByText("Retry")).toBeTruthy();
  });

  it("renders user greeting with name", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => expect(getByText(/^Hey,/)).toBeTruthy());
  });

  it("shows active mesocycle banner", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => expect(getByText("Active Mesocycle")).toBeTruthy());
    expect(getByText(/Summer Block/)).toBeTruthy();
  });

  it("shows 'plan a training block' when no active mesocycle", async () => {
    const noMeso = { ...mockOverview, active_mesocycle: null };
    const qc = setupQueryClient(noMeso);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => expect(getByText("No Active Mesocycle")).toBeTruthy());
    expect(getByText(/Plan a training block/)).toBeTruthy();
  });

  it("shows weekly activity stats", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => {
      expect(getByText("5 / 7 days")).toBeTruthy();
      expect(getByText("Day Streak")).toBeTruthy();
      expect(getByText("Workouts")).toBeTruthy();
    });
  });

  it("shows latest bodyweight", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => {
      expect(getByText("80.5")).toBeTruthy();
    });
  });

  it("shows last workout details", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => {
      expect(getByText("Morning Push")).toBeTruthy();
      expect(getByText("60 min")).toBeTruthy();
      expect(getByText("12 sets")).toBeTruthy();
    });
  });

  it("shows recent PRs", async () => {
    const qc = setupQueryClient(mockOverview);
    const { getByText } = renderHomeScreen(qc);
    await waitFor(() => {
      expect(getByText("Bench Press")).toBeTruthy();
    });
  });

  it("redirects to ProfileSetup when has_profile is false", async () => {
    const noProfile = { ...mockOverview, has_profile: false };
    const qc = setupQueryClient(noProfile);
    renderHomeScreen(qc);
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith("ProfileSetup");
    });
  });

  it("does not redirect when has_profile is true", () => {
    const qc = setupQueryClient(mockOverview);
    renderHomeScreen(qc);
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith("ProfileSetup");
  });
});

describe("ProgressHubScreen", () => {
  const mockAuth = {
    user: { id: 1, username: "testuser", email: "test@example.com" },
    isAuthenticated: true,
  };

  function createDefaultData() {
    return {
      user: { id: 1, username: "testuser", email: "test@example.com", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      has_profile: true,
      profile: null,
      latest_body_weight_log: null,
      active_mesocycle: null,
      latest_completed_session: null,
      recent_personal_records: [],
      workout_streaks: { current_daily_streak: 0, longest_daily_streak: 0, current_weekly_streak: 0, longest_weekly_streak: 0 },
      stats: { total_workout_templates: 0, total_sessions: 0, completed_sessions: 0, personal_record_count: 0, tracked_exercises_count: 0 },
      weekly_activity: [],
    };
  }

  function setupQC(data?: ReturnType<typeof createDefaultData>) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    qc.setQueryData(queryKeys.overview, data ?? createDefaultData());
    return qc;
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuth);
    jest.clearAllMocks();
  });

  it("renders screen title and eyebrow", () => {
    const qc = setupQC();
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("Progress")).toBeTruthy();
  });

  it("shows stat cards with data", () => {
    const data = createDefaultData();
    data.stats.personal_record_count = 12;
    data.stats.completed_sessions = 48;
    data.workout_streaks.current_daily_streak = 5;
    const qc = setupQC(data);
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("12")).toBeTruthy();
    expect(getByText("48")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
  });

  it("renders all progress sections", () => {
    const qc = setupQC();
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("Personal Records")).toBeTruthy();
    expect(getByText("Exercise Progress")).toBeTruthy();
    expect(getByText("Muscle Balance")).toBeTruthy();
  });

  it("shows section badges with dynamic counts", () => {
    const data = createDefaultData();
    data.stats.personal_record_count = 7;
    data.stats.tracked_exercises_count = 15;
    const qc = setupQC(data);
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("7 PRs total")).toBeTruthy();
    expect(getByText("15 exercises tracked")).toBeTruthy();
    expect(getByText("Updated today")).toBeTruthy();
  });

  it("shows latest PR card when available", () => {
    const data = createDefaultData();
    data.recent_personal_records = [{ id: 1, user_id: 1, exercise_id: "Bench Press", record_type: "weight", value: 120, achieved_on: "2026-05-24", session_id: null, set_id: null, notes: null, created_at: "2026-01-01T00:00:00Z" }];
    const qc = setupQC(data);
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("New weight PR")).toBeTruthy();
  });

  it("navigates to PersonalRecords on press", () => {
    const qc = setupQC();
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    fireEvent.press(getByText("Personal Records"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("PersonalRecords");
  });

  it("navigates to ExerciseProgress on press", () => {
    const qc = setupQC();
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    fireEvent.press(getByText("Exercise Progress"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("ExerciseProgress");
  });

  it("shows defaults for zero counts", () => {
    const qc = setupQC();
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: qc }) },
    );
    expect(getByText("0 PRs total")).toBeTruthy();
    expect(getByText("0 exercises tracked")).toBeTruthy();
  });

  it("shows defaults when overview data not in cache", () => {
    const emptyQC = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const { getByText } = render(
      <ProgressHubScreen navigation={mockNavigation} />,
      { wrapper: createWrapper({ queryClient: emptyQC }) },
    );
    expect(getByText("0 PRs total")).toBeTruthy();
  });
});
