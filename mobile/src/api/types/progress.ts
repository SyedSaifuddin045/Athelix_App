export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  exercise_emoji?: string;
  record_type: "1RM" | "3RM" | "5RM" | "e1RM" | "max_reps" | "max_volume";
  value: number;
  weight?: number;
  reps?: number;
  achieved_at: string;
  session_id?: string;
}

export interface PersonalRecordFilter {
  exercise_id?: string;
  record_type?: string;
}

export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  exercise_emoji?: string;
  e1rm_history: Array<{
    date: string;
    value: number;
    e1rm_formula: string;
  }>;
  volume_history: Array<{
    date: string;
    total_volume: number;
    total_sets: number;
  }>;
  weekly_volume: {
    current_week: {
      volume: number;
      sets: number;
    };
    last_week: {
      volume: number;
      sets: number;
    };
    change_percentage: number;
  };
  progressive_overload: {
    is_overloading: boolean;
    current_e1rm: number;
    previous_e1rm: number;
    change: number;
    change_percentage: number;
  };
  workout_streaks: {
    current_streak: number;
    longest_streak: number;
  };
}

export interface MuscleBalance {
  muscle_groups: MuscleGroupData[];
  total_sets: number;
  period: {
    start_date: string;
    end_date: string;
    weeks: number;
  };
}

export interface MuscleGroupData {
  muscle: string;
  sets: number;
  target_sets: number;
  percentage_of_target: number;
  status: "under" | "at_target" | "over";
}

export interface Mesocycle {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  status: "planned" | "active" | "completed" | "cancelled";
  start_date: string;
  end_date: string;
  current_week: number;
  total_weeks: number;
  linked_sessions_count: number;
  created_at: string;
  updated_at: string;
}

export interface MesocycleDetail extends Mesocycle {
  blocks?: MesocycleBlock[];
  analytics?: MesocycleAnalytics;
}

export interface MesocycleBlock {
  id: string;
  name: string;
  week_start: number;
  week_end: number;
  focus?: string;
  deload: boolean;
  sessions_count: number;
}

export interface MesocycleAnalytics {
  total_volume: number;
  total_sessions: number;
  total_sets: number;
  total_prs: number;
  average_session_duration: number;
  volume_by_week: Array<{
    week: number;
    volume: number;
  }>;
  exercise_deltas: Array<{
    exercise_id: string;
    exercise_name: string;
    previous_e1rm: number;
    current_e1rm: number;
    change: number;
  }>;
  muscle_balance?: MuscleBalance;
  deload_recommended: boolean;
}
