export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
  fitness_level?: "beginner" | "intermediate" | "advanced" | "elite";
  primary_goal?: string;
  units?: "metric" | "imperial";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOverview {
  user: User;
  has_profile: boolean;
  profile?: UserProfile;
  latest_body_weight_log?: BodyWeightLog;
  active_mesocycle?: MesocycleSummary;
  latest_completed_session?: WorkoutSessionSummary;
  recent_personal_records: PersonalRecordSummary[];
  workout_streaks: WorkoutStreak;
  stats: UserStats;
}

export interface BodyWeightLog {
  id: string;
  weight: number;
  logged_at: string;
  note?: string;
}

export interface MesocycleSummary {
  id: string;
  name: string;
  current_week: number;
  total_weeks: number;
  status: "active" | "planned" | "completed";
}

export interface WorkoutSessionSummary {
  id: string;
  name: string;
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  total_sets: number;
  total_volume: number;
  mood?: string;
  prs_count: number;
}

export interface PersonalRecordSummary {
  id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_emoji: string;
  record_type: string;
  value: number;
  unit: string;
  achieved_at: string;
}

export interface WorkoutStreak {
  current_daily_streak: number;
  longest_daily_streak: number;
  current_weekly_streak: number;
  longest_weekly_streak: number;
  workouts_this_week?: number;
  workouts_last_week?: number;
}

export interface UserStats {
  total_workout_templates: number;
  total_sessions: number;
  completed_sessions: number;
  personal_record_count: number;
  total_workouts?: number;
  total_volume?: number;
  total_sets?: number;
  total_prs?: number;
  workouts_this_month?: number;
  average_duration_minutes?: number;
}

export interface UserStats {
  total_workout_templates: number;
  total_sessions: number;
  completed_sessions: number;
  personal_record_count: number;
  total_volume?: number;
  total_sets?: number;
  total_prs?: number;
  workouts_this_month?: number;
  average_duration_minutes?: number;
}

export interface AppConfig {
  app_name: string;
  app_version: string;
  token_lifetime_seconds: number;
  refresh_token_lifetime_seconds: number;
  supported_e1rm_formulas: string[];
  supported_pr_record_types: string[];
  supported_mesocycle_goals: string[];
  docs_url: string;
  api_version: string;
}
