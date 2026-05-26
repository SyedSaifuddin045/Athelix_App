import { http, HttpResponse } from "msw";

const BASE = "";

export const handlers = [
  http.get(`${BASE}/workout-sessions`, () =>
    HttpResponse.json({
      data: [
        {
          id: 1,
          name: "Morning Push",
          started_at: "2026-05-20T09:00:00Z",
          finished_at: "2026-05-20T10:00:00Z",
          is_completed: true,
          duration_minutes: 60,
          total_sets: 12,
          total_volume: 4500,
          mood: "😊",
          prs_count: 1,
        },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/workout-templates`, () =>
    HttpResponse.json({
      data: [
        { id: 1, name: "Push Day A", description: "Chest and triceps", is_public: false, updated_at: "2026-05-15T12:00:00Z" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/exercises`, () =>
    HttpResponse.json({
      items: [
        { id: "ex1", name: "Bench Press", target: "Chest", body_part: "Upper Body", equipment: "Barbell" },
        { id: "ex2", name: "Squat", target: "Quads", body_part: "Legs", equipment: "Barbell" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/mesocycles`, () =>
    HttpResponse.json({
      data: [
        { id: 1, name: "Summer Block", goal: "Hypertrophy", started_on: "2026-05-01", weeks: 8, sessions: [] },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/personal-records`, () =>
    HttpResponse.json({
      data: [
        { id: 1, exercise_name: "Bench Press", record_type: "weight", value: 100, achieved_on: "2026-05-20" },
      ],
      status: 200,
    }),
  ),

  http.get(`${BASE}/overview`, () =>
    HttpResponse.json({
      data: {
        stats: { personal_record_count: 3, completed_sessions: 12, tracked_exercises_count: 8 },
        workout_streaks: { current_daily_streak: 5 },
        recent_personal_records: [],
        user: { id: 1, username: "testuser" },
        profile: { display_name: "Test User" },
        has_profile: true,
        latest_completed_session: null,
        latest_body_weight_log: null,
        active_mesocycle: null,
      },
      status: 200,
    }),
  ),
];
