import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
  ExerciseDetail: { id: string };
  TemplateList: undefined;
  TemplateBuilder: { id?: string };
  StartWorkout: undefined;
  ActiveWorkout: { sessionId?: string; templateId?: string };
  WorkoutHistory: undefined;
  SessionDetail: { id: string };
  MesocycleList: undefined;
  MesocycleDetail: { id: string };
  PersonalRecords: undefined;
  ExerciseProgress: { id: string };
  MuscleBalance: undefined;
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

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type { TemplateExercise, WorkoutExercise } from "../data";
