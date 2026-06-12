export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface ExerciseItem {
  id: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  difficulty: Difficulty;
}

export interface ExerciseDetail {
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: Difficulty;
  category: string;
  instructions: string[];
  tips: string[];
}

export interface TemplateSet {
  reps: string;
  rpe: string;
  rest: string;
}

export interface TemplateExercise {
  id: string;
  name: string;
  sets: TemplateSet[];
  notes: string;
}

export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
  warmup: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes: string;
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Beginner: "#22c55e",
  Intermediate: "#f59e0b",
  Advanced: "#ef4444",
};

export const MAIN_TABS = [
  { key: "home", label: "Home" },
  { key: "explore", label: "Explore" },
  { key: "train", label: "Train" },
  { key: "progress", label: "Progress" },
  { key: "profile", label: "Profile" },
] as const;

export const RECENT_PRS = [
  { exercise: "Bench Press", value: "110 kg", date: "3 days ago", color: "#FF5A36" },
  { exercise: "Squat", value: "145 kg", date: "1 week ago", color: "#22c55e" },
  { exercise: "Deadlift", value: "185 kg", date: "2 weeks ago", color: "#FF5A36" },
  { exercise: "OHP", value: "78 kg", date: "2 weeks ago", color: "#22c55e" },
];

export const ALL_EXERCISES: ExerciseItem[] = [
  { id: "1", name: "Bench Press", primaryMuscle: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { id: "2", name: "Back Squat", primaryMuscle: "Quadriceps", equipment: "Barbell", difficulty: "Intermediate" },
  { id: "3", name: "Deadlift", primaryMuscle: "Hamstrings", equipment: "Barbell", difficulty: "Advanced" },
  { id: "4", name: "Overhead Press", primaryMuscle: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  { id: "5", name: "Pull-up", primaryMuscle: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "6", name: "Barbell Row", primaryMuscle: "Back", equipment: "Barbell", difficulty: "Intermediate" },
  { id: "7", name: "Romanian Deadlift", primaryMuscle: "Hamstrings", equipment: "Barbell", difficulty: "Intermediate" },
  { id: "8", name: "Dumbbell Curl", primaryMuscle: "Biceps", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "9", name: "Tricep Dips", primaryMuscle: "Triceps", equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "10", name: "Leg Press", primaryMuscle: "Quadriceps", equipment: "Machine", difficulty: "Beginner" },
  { id: "11", name: "Lateral Raise", primaryMuscle: "Shoulders", equipment: "Dumbbell", difficulty: "Beginner" },
  { id: "12", name: "Cable Row", primaryMuscle: "Back", equipment: "Cable", difficulty: "Beginner" },
  { id: "13", name: "Incline DB Press", primaryMuscle: "Chest", equipment: "Dumbbell", difficulty: "Intermediate" },
  { id: "14", name: "Face Pull", primaryMuscle: "Rear Delts", equipment: "Cable", difficulty: "Beginner" },
  { id: "15", name: "Bulgarian Split Squat", primaryMuscle: "Quadriceps", equipment: "Dumbbell", difficulty: "Advanced" },
  { id: "16", name: "Hip Thrust", primaryMuscle: "Glutes", equipment: "Barbell", difficulty: "Intermediate" },
];

export const EXERCISE_MUSCLES = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Quadriceps",
  "Hamstrings",
  "Biceps",
  "Triceps",
  "Glutes",
];

export const EXERCISE_EQUIPMENT = [
  "All",
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Bodyweight",
];

export const EXERCISE_DETAILS: Record<string, ExerciseDetail> = {
  "1": {
    name: "Bench Press",
    primaryMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Front Delts"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    category: "Compound",
    instructions: [
      "Lie flat on bench with eyes under the bar. Grip slightly wider than shoulder-width.",
      "Unrack the bar and hold it directly above your chest with arms fully extended.",
      "Lower the bar to your lower chest in a controlled arc, keeping elbows at about 75 degrees.",
      "Press the bar back up explosively, driving through your feet and upper back.",
      "Lock out at the top without hyperextending the elbows.",
    ],
    tips: [
      "Keep your back arched and shoulder blades retracted",
      "Drive your feet into the floor",
      "Bar should touch lower chest, not sternum",
    ],
  },
  "2": {
    name: "Back Squat",
    primaryMuscle: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: "Barbell",
    difficulty: "Intermediate",
    category: "Compound",
    instructions: [
      "Set bar on upper traps. Step back, feet shoulder-width apart, toes slightly out.",
      "Brace your core and take a deep breath before descending.",
      "Descend by pushing knees out and hips back simultaneously.",
      "Break parallel so the crease of the hip moves below the top of the knee.",
      "Drive through the whole foot to stand, keeping chest tall.",
    ],
    tips: [
      "Keep knees tracking over toes",
      "Maintain a neutral spine",
      "Brace hard before every rep",
    ],
  },
  "3": {
    name: "Deadlift",
    primaryMuscle: "Hamstrings",
    secondaryMuscles: ["Glutes", "Back", "Core", "Traps"],
    equipment: "Barbell",
    difficulty: "Advanced",
    category: "Compound",
    instructions: [
      "Stand with bar over mid-foot, feet hip-width. Grip just outside shins.",
      "Hinge at hips and push them back. Keep shoulders over the bar.",
      "Create tension and pull the slack out of the bar before lifting.",
      "Push the floor away so legs and back rise at the same rate.",
      "Lock out by squeezing glutes, hips fully extended, standing tall.",
    ],
    tips: [
      "Bar stays close to legs throughout",
      "Hips should not shoot up first",
      "Take the slack out before pulling",
    ],
  },
};

export const EXERCISE_FALLBACK: ExerciseDetail = {
  name: "Exercise",
  primaryMuscle: "Various",
  secondaryMuscles: ["Core"],
  equipment: "Barbell",
  difficulty: "Intermediate",
  category: "Compound",
  instructions: [
    "Follow proper form for this exercise.",
    "Maintain controlled movement throughout.",
    "Focus on the target muscle contraction.",
  ],
  tips: [
    "Use full range of motion",
    "Control the eccentric",
    "Breathe consistently",
  ],
};

export const TRAIN_SECTIONS = [
  {
    title: "Templates",
    desc: "Saved workout plans and routines",
    path: "templateList",
    color: "#FF5A36",
    badgeKey: "templates" as const,
  },
  {
    title: "Workout History",
    desc: "All past sessions and sets",
    path: "workoutHistory",
    color: "#22c55e",
    badgeKey: "sessions" as const,
  },
  {
    title: "Mesocycles",
    desc: "Advanced block planning",
    path: "mesocycleList",
    color: "#8b5cf6",
    badge: "Advanced",
    advanced: true,
  },
] as const;

export const START_WORKOUT_TEMPLATES = [
  { id: "1", name: "Upper Body Push", exercises: 5, sets: 20, duration: "~55 min", color: "#FF5A36", lastUsed: "Yesterday" },
  { id: "2", name: "Lower Body Power", exercises: 5, sets: 22, duration: "~65 min", color: "#22c55e", lastUsed: "3 days ago" },
  { id: "3", name: "Pull Day", exercises: 6, sets: 24, duration: "~55 min", color: "#3b82f6", lastUsed: "4 days ago" },
  { id: "4", name: "Upper Body Pull", exercises: 5, sets: 18, duration: "~50 min", color: "#8b5cf6", lastUsed: "1 week ago" },
];

export const MESOCYCLES = [
  { id: "1", name: "Strength Block", week: "Week 3/6", color: "#FF5A36" },
  { id: "2", name: "Hypertrophy Phase", week: "Not started", color: "#8b5cf6" },
];

export const TEMPLATE_LIST = [
  {
    id: "1",
    name: "Upper Body Push",
    exercises: ["Bench Press", "OHP", "Incline DB Press", "Lateral Raise", "Tricep Dips"],
    duration: "~55 min",
    sets: 20,
    color: "#FF5A36",
    lastUsed: "Yesterday",
  },
  {
    id: "2",
    name: "Lower Body Power",
    exercises: ["Back Squat", "Romanian DL", "Leg Press", "Bulgarian Split Squat", "Calf Raises"],
    duration: "~65 min",
    sets: 22,
    color: "#22c55e",
    lastUsed: "3 days ago",
  },
  {
    id: "3",
    name: "Pull Day",
    exercises: ["Deadlift", "Pull-up", "Barbell Row", "Cable Row", "Face Pull", "Dumbbell Curl"],
    duration: "~55 min",
    sets: 24,
    color: "#3b82f6",
    lastUsed: "4 days ago",
  },
  {
    id: "4",
    name: "Upper Body Pull",
    exercises: ["Weighted Pull-up", "Barbell Row", "Cable Row", "Face Pull", "Hammer Curl"],
    duration: "~50 min",
    sets: 18,
    color: "#8b5cf6",
    lastUsed: "1 week ago",
  },
  {
    id: "5",
    name: "Full Body Power",
    exercises: ["Power Clean", "Front Squat", "Push Press", "Romanian DL"],
    duration: "~70 min",
    sets: 16,
    color: "#f59e0b",
    lastUsed: "2 weeks ago",
  },
];

export const DEFAULT_TEMPLATE_EXERCISES: TemplateExercise[] = [
  {
    id: "1",
    name: "Bench Press",
    notes: "",
    sets: [
      { reps: "5", rpe: "7", rest: "3:00" },
      { reps: "5", rpe: "8", rest: "3:00" },
      { reps: "5", rpe: "9", rest: "3:00" },
    ],
  },
  {
    id: "2",
    name: "OHP",
    notes: "",
    sets: [
      { reps: "8", rpe: "7", rest: "2:00" },
      { reps: "8", rpe: "8", rest: "2:00" },
    ],
  },
];

export const INITIAL_WORKOUT_EXERCISES: WorkoutExercise[] = [
  {
    id: "1",
    name: "Bench Press",
    notes: "",
    sets: [
      { id: "w1", weight: "80", reps: "5", rpe: "", done: false, warmup: true },
      { id: "s1", weight: "100", reps: "5", rpe: "", done: false, warmup: false },
      { id: "s2", weight: "100", reps: "5", rpe: "", done: false, warmup: false },
      { id: "s3", weight: "100", reps: "5", rpe: "", done: false, warmup: false },
    ],
  },
  {
    id: "2",
    name: "OHP",
    notes: "",
    sets: [
      { id: "s4", weight: "60", reps: "8", rpe: "", done: false, warmup: false },
      { id: "s5", weight: "60", reps: "8", rpe: "", done: false, warmup: false },
    ],
  },
];

export const WORKOUT_SESSIONS = [
  { id: "1", name: "Upper Body Push", date: "Today", time: "6:30 AM", duration: 52, sets: 18, volume: "8.4k kg", prs: 1, mood: "💪" },
  { id: "2", name: "Lower Body Power", date: "Yesterday", time: "5:45 PM", duration: 61, sets: 22, volume: "12.2k kg", prs: 0, mood: "😊" },
  { id: "3", name: "Pull Day", date: "Mon, Mar 16", time: "7:00 AM", duration: 48, sets: 20, volume: "7.8k kg", prs: 0, mood: "😐" },
  { id: "4", name: "Upper Body Push", date: "Sat, Mar 14", time: "10:00 AM", duration: 55, sets: 19, volume: "8.1k kg", prs: 2, mood: "🔥" },
  { id: "5", name: "Lower Body Power", date: "Thu, Mar 12", time: "6:00 PM", duration: 58, sets: 21, volume: "11.9k kg", prs: 0, mood: "💪" },
  { id: "6", name: "Pull Day", date: "Tue, Mar 10", time: "7:15 AM", duration: 47, sets: 18, volume: "7.5k kg", prs: 1, mood: "😊" },
  { id: "7", name: "Full Body Power", date: "Sun, Mar 8", time: "9:30 AM", duration: 72, sets: 16, volume: "9.2k kg", prs: 0, mood: "😴" },
];

export const WORKOUT_WEEKS: Record<string, typeof WORKOUT_SESSIONS> = {
  "This Week": WORKOUT_SESSIONS.slice(0, 3),
  "Last Week": WORKOUT_SESSIONS.slice(3, 6),
  "2 Weeks Ago": WORKOUT_SESSIONS.slice(6),
};

export const SESSION_DETAIL = {
  id: "1",
  name: "Upper Body Push",
  date: "Today - 6:30 AM",
  duration: 52,
  sets: 18,
  volume: "8.4k kg",
  prs: 1,
  mood: "💪",
  notes: "Felt strong today. Hit a new bench PR!",
  exercises: [
    {
      name: "Bench Press",
      pr: true,
      sets: [
        { type: "W", weight: "80", reps: "5", rpe: "-" },
        { type: "1", weight: "100", reps: "5", rpe: "7" },
        { type: "2", weight: "100", reps: "5", rpe: "8" },
        { type: "3", weight: "110", reps: "3", rpe: "9" },
      ],
    },
    {
      name: "OHP",
      pr: false,
      sets: [
        { type: "1", weight: "60", reps: "8", rpe: "7" },
        { type: "2", weight: "62.5", reps: "7", rpe: "8" },
        { type: "3", weight: "62.5", reps: "6", rpe: "9" },
      ],
    },
    {
      name: "Incline DB Press",
      pr: false,
      sets: [
        { type: "1", weight: "32", reps: "10", rpe: "7" },
        { type: "2", weight: "32", reps: "9", rpe: "8" },
        { type: "3", weight: "32", reps: "8", rpe: "9" },
      ],
    },
    {
      name: "Lateral Raise",
      pr: false,
      sets: [
        { type: "1", weight: "14", reps: "15", rpe: "7" },
        { type: "2", weight: "14", reps: "15", rpe: "7" },
        { type: "3", weight: "14", reps: "12", rpe: "8" },
      ],
    },
    {
      name: "Tricep Dips",
      pr: false,
      sets: [
        { type: "1", weight: "BW", reps: "12", rpe: "7" },
        { type: "2", weight: "BW", reps: "10", rpe: "8" },
        { type: "3", weight: "BW+5", reps: "8", rpe: "9" },
      ],
    },
  ],
};

export const MESOCYCLE_LIST = [
  {
    id: "1",
    name: "Strength Block",
    phase: "Phase 1 - Linear Progression",
    weeks: 6,
    currentWeek: 3,
    startDate: "Mar 3, 2026",
    endDate: "Apr 13, 2026",
    status: "active",
    sessions: 14,
    color: "#FF5A36",
  },
  {
    id: "2",
    name: "Hypertrophy Phase",
    phase: "Phase 2 - Volume Accumulation",
    weeks: 8,
    currentWeek: 0,
    startDate: "Apr 20, 2026",
    endDate: "Jun 14, 2026",
    status: "planned",
    sessions: 0,
    color: "#8b5cf6",
  },
  {
    id: "3",
    name: "Deload Week",
    phase: "Recovery - 60% intensity",
    weeks: 1,
    currentWeek: 1,
    startDate: "Feb 24, 2026",
    endDate: "Mar 2, 2026",
    status: "completed",
    sessions: 3,
    color: "#22c55e",
  },
];

export const MESOCYCLE_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(255,90,54,0.15)", color: "#FF5A36", label: "Active" },
  planned: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "Planned" },
  completed: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", label: "Completed" },
};

export const MESO_VOLUME_DATA = [
  { label: "W1", value: 18200 },
  { label: "W2", value: 21400 },
  { label: "W3", value: 24200 },
  { label: "W4", value: 0 },
  { label: "W5", value: 0 },
  { label: "W6", value: 0 },
];

export const LINKED_SESSIONS = [
  { id: "1", name: "Upper Body Push", date: "Today", sets: 18, volume: "8.4k" },
  { id: "2", name: "Lower Body Power", date: "Yesterday", sets: 22, volume: "12.2k" },
  { id: "3", name: "Pull Day", date: "Mon, Mar 16", sets: 20, volume: "7.8k" },
  { id: "4", name: "Upper Body Push", date: "Sat, Mar 14", sets: 19, volume: "8.1k" },
];

export const PROGRESS_SECTIONS = [
  {
    path: "achievements",
    color: "#fbbf24",
    title: "Achievements",
    desc: "All personal records and milestones earned",
    badgeKey: "prs" as const,
  },
  {
    path: "personalRecords",
    color: "#fbbf24",
    title: "Personal Records",
    desc: "All-time best lifts by exercise and record type",
    badgeKey: "prs" as const,
  },
  {
    path: "exerciseProgress",
    color: "#FF5A36",
    title: "Exercise Progress",
    desc: "e1RM history, volume trends and overload signals",
    badgeKey: "exercises" as const,
  },
  {
    path: "muscleBalance",
    color: "#8b5cf6",
    title: "Muscle Balance",
    desc: "Weekly sets by muscle group to spot imbalances",
    badge: "Updated today",
  },
] as const;

export const PROGRESS_QUICK_STATS = [
  { label: "Total PRs", value: "9", color: "#fbbf24" },
  { label: "Best e1RM", value: "205kg", color: "#FF5A36" },
  { label: "This Month", value: "3 PRs", color: "#22c55e" },
];

export const PERSONAL_RECORDS = [
  {
    id: "1",
    exercise: "Bench Press",
    exerciseId: "1",
    records: [
      { type: "1RM", value: "115 kg", date: "Mar 15, 2026", isNew: true },
      { type: "3RM", value: "110 kg", date: "Mar 15, 2026", isNew: false },
      { type: "5RM", value: "102.5 kg", date: "Feb 28, 2026", isNew: false },
    ],
  },
  {
    id: "2",
    exercise: "Back Squat",
    exerciseId: "2",
    records: [
      { type: "1RM", value: "160 kg", date: "Feb 20, 2026", isNew: false },
      { type: "3RM", value: "145 kg", date: "Mar 10, 2026", isNew: true },
      { type: "5RM", value: "135 kg", date: "Jan 15, 2026", isNew: false },
    ],
  },
  {
    id: "3",
    exercise: "Deadlift",
    exerciseId: "3",
    records: [
      { type: "1RM", value: "200 kg", date: "Jan 30, 2026", isNew: false },
      { type: "3RM", value: "185 kg", date: "Feb 14, 2026", isNew: false },
      { type: "5RM", value: "175 kg", date: "Mar 1, 2026", isNew: true },
    ],
  },
  {
    id: "4",
    exercise: "Overhead Press",
    exerciseId: "4",
    records: [
      { type: "1RM", value: "85 kg", date: "Mar 5, 2026", isNew: true },
      { type: "5RM", value: "75 kg", date: "Feb 22, 2026", isNew: false },
    ],
  },
  {
    id: "5",
    exercise: "Pull-up",
    exerciseId: "5",
    records: [
      { type: "1RM", value: "BW+50 kg", date: "Feb 10, 2026", isNew: false },
      { type: "5RM", value: "BW+35 kg", date: "Mar 8, 2026", isNew: true },
    ],
  },
];

export const RECORD_TYPES = ["All", "1RM", "3RM", "5RM"];

export const EXERCISE_PROGRESS_SERIES = [
  { label: "Jan W1", value: 108 },
  { label: "Jan W2", value: 110 },
  { label: "Jan W3", value: 108 },
  { label: "Jan W4", value: 112 },
  { label: "Feb W1", value: 110 },
  { label: "Feb W2", value: 114 },
  { label: "Feb W3", value: 113 },
  { label: "Feb W4", value: 116 },
  { label: "Mar W1", value: 115 },
  { label: "Mar W2", value: 118 },
  { label: "Mar W3", value: 120 },
  { label: "Mar W4", value: 122 },
];

export const EXERCISE_PROGRESS_VOLUME = [
  { label: "W1", value: 2800, highlight: false },
  { label: "W2", value: 3100, highlight: false },
  { label: "W3", value: 2600, highlight: false },
  { label: "W4", value: 3400, highlight: false },
  { label: "W5", value: 3200, highlight: false },
  { label: "W6", value: 3800, highlight: true },
];

export const EXERCISE_PROGRESS_PERIODS = ["1M", "3M", "6M", "1Y", "All"];

export const EXERCISE_NAMES: Record<string, { name: string }> = {
  "1": { name: "Bench Press" },
  "2": { name: "Back Squat" },
  "3": { name: "Deadlift" },
};

export const EXERCISE_OVERLOADS = [
  { date: "Mar 15", change: "+5 kg", type: "Weight increase", session: "Upper Body Push" },
  { date: "Mar 8", change: "+1 rep", type: "Volume increase", session: "Upper Body Push" },
  { date: "Mar 1", change: "+2.5 kg", type: "Weight increase", session: "Upper Body Push" },
];

export const MUSCLE_DATA = [
  { muscle: "Chest", sets: 18, target: 16, color: "#FF5A36" },
  { muscle: "Back", sets: 22, target: 20, color: "#22c55e" },
  { muscle: "Shoulders", sets: 14, target: 16, color: "#f59e0b" },
  { muscle: "Quadriceps", sets: 16, target: 16, color: "#FF5A36" },
  { muscle: "Hamstrings", sets: 10, target: 12, color: "#ef4444" },
  { muscle: "Glutes", sets: 8, target: 12, color: "#ef4444" },
  { muscle: "Biceps", sets: 9, target: 10, color: "#f59e0b" },
  { muscle: "Triceps", sets: 12, target: 10, color: "#22c55e" },
  { muscle: "Core", sets: 6, target: 8, color: "#f59e0b" },
  { muscle: "Calves", sets: 4, target: 8, color: "#ef4444" },
];

export const MUSCLE_PERIODS = ["1W", "2W", "4W", "8W"];

export const PROFILE_STATS = [
  { label: "Workouts", value: "248" },
  { label: "Day Streak", value: "12" },
  { label: "All-time PRs", value: "9" },
];

export const ACHIEVEMENTS = [
  { icon: "🏆", label: "100kg Bench", date: "Mar 2025" },
  { icon: "🔥", label: "14-Day Streak", date: "Jan 2026" },
  { icon: "💪", label: "100k kg Vol.", date: "Feb 2026" },
  { icon: "⚡", label: "Squat PR", date: "Mar 2026" },
];

export const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];
export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
export const UNITS = [
  { label: "Metric (kg / cm)", value: "metric" },
  { label: "Imperial (lbs / ft)", value: "imperial" },
];
export const GOALS = [
  "Build muscle",
  "Lose fat",
  "Improve strength",
  "General fitness",
  "Athletic performance",
];

export const MESOCYCLE_GOALS = [
  { label: "Strength", value: "strength" },
  { label: "Hypertrophy", value: "hypertrophy" },
  { label: "Endurance", value: "endurance" },
  { label: "Weight Loss", value: "weight_loss" },
  { label: "Maintenance", value: "maintenance" },
] as const;

export const BODYWEIGHT_ENTRIES = [
  { id: "1", date: "Mar 18, 2026", weight: 82.4, note: "Morning, post-workout" },
  { id: "2", date: "Mar 15, 2026", weight: 82.7, note: "" },
  { id: "3", date: "Mar 12, 2026", weight: 83.0, note: "After cheat day" },
  { id: "4", date: "Mar 9, 2026", weight: 82.8, note: "" },
  { id: "5", date: "Mar 6, 2026", weight: 83.3, note: "" },
  { id: "6", date: "Mar 3, 2026", weight: 83.1, note: "" },
  { id: "7", date: "Feb 28, 2026", weight: 83.6, note: "" },
  { id: "8", date: "Feb 24, 2026", weight: 83.9, note: "" },
  { id: "9", date: "Feb 20, 2026", weight: 84.1, note: "" },
  { id: "10", date: "Feb 16, 2026", weight: 84.3, note: "" },
];

export const BODYWEIGHT_CHART = [
  { label: "Feb 16", value: 84.3 },
  { label: "Feb 20", value: 84.1 },
  { label: "Feb 24", value: 83.9 },
  { label: "Feb 28", value: 83.6 },
  { label: "Mar 3", value: 83.1 },
  { label: "Mar 6", value: 83.3 },
  { label: "Mar 9", value: 82.8 },
  { label: "Mar 12", value: 83.0 },
  { label: "Mar 15", value: 82.7 },
  { label: "Mar 18", value: 82.4 },
];
