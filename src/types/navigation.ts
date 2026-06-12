export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  ExerciseDetail: { id: string };
  TemplateList: undefined;
  TemplateBuilder: { id?: string };
  StartWorkout: { id?: string };
  ActiveWorkout: { sessionId?: number; templateId?: string; mesocycleId?: string | null } | undefined;
  WorkoutHistory: undefined;
  SessionDetail: { id: string };
  MesocycleList: undefined;
  MesocycleDetail: { id: string };
  Achievements: undefined;
  PersonalRecords: undefined;
  ExerciseProgress: { id?: string };
  MuscleBalance: { mesocycleId?: number } | undefined;
  BodyweightHistory: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Train: undefined;
  Progress: undefined;
  Profile: undefined;
};
