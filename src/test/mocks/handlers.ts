import { http, HttpResponse } from "msw";

const BASE = "";

export const handlers = [
  http.get(`${BASE}/meta/app-config`, () =>
    HttpResponse.json({
      data: {
        app: { name: "Athelix", version: "1.0.0" },
        features: { bodyweight_logging: true, mesocycles: true, personal_records: true },
        auth: { oauth_providers: ["google", "facebook", "apple"] },
        docs: { privacy_policy_url: "https://athelix.fit/privacy" },
        supported_values: { units: ["kg", "lbs"], fitness_levels: ["Beginner", "Intermediate", "Advanced"] },
      },
      status: 200,
    }),
  ),

  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      data: { id: 1, username: "testuser", email: "test@example.com" },
      status: 200,
    }),
  ),

  http.get(`${BASE}/users/me`, () =>
    HttpResponse.json({
      data: { id: 1, username: "testuser", email: "test@example.com", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      status: 200,
    }),
  ),

  http.get(`${BASE}/users/me/overview`, () =>
    HttpResponse.json({
      data: {
        user: { id: 1, username: "testuser", email: "test@example.com", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
        has_profile: true,
        profile: { id: 1, user_id: 1, display_name: "Test User", date_of_birth: null, gender: null, height_cm: null, weight_kg: null, fitness_level: null, preferred_unit: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
        stats: { total_workout_templates: 8, total_sessions: 20, completed_sessions: 15, personal_record_count: 5, tracked_exercises_count: 10 },
        workout_streaks: { current_daily_streak: 5, longest_daily_streak: 10, current_weekly_streak: 2, longest_weekly_streak: 4 },
        recent_personal_records: [],
        latest_completed_session: null,
        latest_body_weight_log: null,
        active_mesocycle: null,
        weekly_activity: [
          { day: "Mon", value: 1 }, { day: "Tue", value: 0 }, { day: "Wed", value: 1 },
          { day: "Thu", value: 0 }, { day: "Fri", value: 1 }, { day: "Sat", value: 1 }, { day: "Sun", value: 0 },
        ],
      },
      status: 200,
    }),
  ),

  http.get(`${BASE}/users/me/profile`, () =>
    HttpResponse.json({
      data: { id: 1, user_id: 1, display_name: "Test User", date_of_birth: null, gender: null, height_cm: 175, weight_kg: 80, fitness_level: "Intermediate", preferred_unit: "kg", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      status: 200,
    }),
  ),

  http.get(`${BASE}/users/me/body-weight-logs`, () =>
    HttpResponse.json({
      data: [
        { id: 1, user_id: 1, weight_kg: 80.5, logged_at: "2026-05-24T10:00:00Z", notes: null },
        { id: 2, user_id: 1, weight_kg: 81.0, logged_at: "2026-05-23T10:00:00Z", notes: null },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/workout-sessions`, () =>
    HttpResponse.json({
      data: [
        { id: 1, user_id: 1, template_id: null, mesocycle_id: null, name: "Morning Push", started_at: "2026-05-20T09:00:00Z", finished_at: "2026-05-20T10:00:00Z", perceived_exertion: null, mood: null, location: null, notes: null, is_completed: true, duration_minutes: 60, total_sets: 12, total_volume: 4500, prs_count: 1 },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/workout-sessions/:id`, () =>
    HttpResponse.json({
      data: { id: 1, user_id: 1, template_id: null, mesocycle_id: null, name: "Morning Push", started_at: "2026-05-20T09:00:00Z", finished_at: "2026-05-20T10:00:00Z", perceived_exertion: 7, mood: "great", location: "Gym", notes: "Felt strong today", is_completed: true, duration_minutes: 60, total_sets: 12, total_volume: 4500, prs_count: 1, sets: [] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/workout-templates`, () =>
    HttpResponse.json({
      data: [
        { id: 1, name: "Push Day A", description: "Chest and triceps", is_public: false, updated_at: "2026-05-15T12:00:00Z" },
        { id: 2, name: "Pull Day A", description: "Back and biceps", is_public: false, updated_at: "2026-05-14T12:00:00Z" },
        { id: 3, name: "Leg Day A", description: "Quads and hamstrings", is_public: true, updated_at: "2026-05-13T12:00:00Z" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/workout-templates/:id`, () =>
    HttpResponse.json({
      data: { id: 1, name: "Push Day A", description: "Chest and triceps", is_public: false, updated_at: "2026-05-15T12:00:00Z", exercises: [] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/exercises`, () =>
    HttpResponse.json({
      items: [
        { id: "ex1", name: "Bench Press", target: "Chest", body_part: "Upper Body", equipment: "Barbell", gif_url: null },
        { id: "ex2", name: "Squat", target: "Quads", body_part: "Legs", equipment: "Barbell", gif_url: null },
        { id: "ex3", name: "Deadlift", target: "Hamstrings", body_part: "Legs", equipment: "Barbell", gif_url: null },
        { id: "ex4", name: "Overhead Press", target: "Shoulders", body_part: "Upper Body", equipment: "Barbell", gif_url: null },
        { id: "ex5", name: "Pull Up", target: "Back", body_part: "Upper Body", equipment: "Bodyweight", gif_url: null },
      ],
      total: 5,
      limit: 20,
      offset: 0,
      status: 200,
    }),
  ),

  http.get(`${BASE}/exercises/filters`, () =>
    HttpResponse.json({
      data: { targets: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings"], equipment: ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/exercises/:id`, () =>
    HttpResponse.json({
      data: { id: "ex1", name: "Bench Press", target: "Chest", body_part: "Upper Body", equipment: "Barbell", difficulty: "Intermediate", gif_url: null, instructions: [{ step_number: 1, instruction: "Lie on bench" }], secondary_muscles: [{ muscle: "Triceps" }, { muscle: "Front Delts" }] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/mesocycles`, () =>
    HttpResponse.json({
      data: [
        { id: 1, user_id: 1, name: "Summer Block", goal: "Hypertrophy", started_on: "2026-05-01", ended_on: null, weeks: 8, notes: null, created_at: "2026-01-01T00:00:00Z" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/mesocycles/:id`, () =>
    HttpResponse.json({
      data: { id: 1, user_id: 1, name: "Summer Block", goal: "Hypertrophy", started_on: "2026-05-01", ended_on: null, weeks: 8, notes: null, created_at: "2026-01-01T00:00:00Z", sessions: [] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/mesocycles/:id/analytics`, () =>
    HttpResponse.json({
      data: { total_sessions: 12, completion_rate: 0.85, average_volume: 4500, volume_trend: [] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/personal-records`, () =>
    HttpResponse.json({
      data: [
        { id: 1, user_id: 1, exercise_id: "Bench Press", record_type: "weight", value: 100, achieved_on: "2026-05-20", session_id: null, set_id: null, notes: null, created_at: "2026-01-01T00:00:00Z" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/progress/:id`, () =>
    HttpResponse.json({
      data: { exercise_id: "ex1", exercise_name: "Bench Press", default_formula: "epley", current_e1rm: null, best_e1rm: null, e1rm_history: [], volume_history: [], weekly_volume_history: [], progressive_overload: [], workout_streaks: { current_daily_streak: 5, longest_daily_streak: 10, current_weekly_streak: 2, longest_weekly_streak: 4 } },
      status: 200,
    }),
  ),

  http.get(`${BASE}/analytics/muscle-balance`, () =>
    HttpResponse.json({
      data: { muscle_group_balance_items: [{ muscle: "Chest", weekly_sets: 12, target_sets: 15 }, { muscle: "Back", weekly_sets: 10, target_sets: 12 }] },
      status: 200,
    }),
  ),

  http.get(`${BASE}/health`, () =>
    HttpResponse.json({ status: "ok" }),
  ),
];
