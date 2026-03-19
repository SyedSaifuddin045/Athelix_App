import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { SplashScreen } from "./components/auth/SplashScreen";
import { LoginScreen } from "./components/auth/LoginScreen";
import { RegisterScreen } from "./components/auth/RegisterScreen";
import { HomePage } from "./components/home/HomePage";
import { ExploreScreen } from "./components/explore/ExploreScreen";
import { ExerciseDetailScreen } from "./components/explore/ExerciseDetailScreen";
import { TrainHub } from "./components/train/TrainHub";
import { TemplateListScreen } from "./components/train/TemplateListScreen";
import { TemplateBuilderScreen } from "./components/train/TemplateBuilderScreen";
import { StartWorkoutScreen } from "./components/train/StartWorkoutScreen";
import { ActiveWorkoutScreen } from "./components/train/ActiveWorkoutScreen";
import { WorkoutHistoryScreen } from "./components/train/WorkoutHistoryScreen";
import { SessionDetailScreen } from "./components/train/SessionDetailScreen";
import { MesocycleListScreen } from "./components/train/MesocycleListScreen";
import { MesocycleDetailScreen } from "./components/train/MesocycleDetailScreen";
import { ProgressHub } from "./components/progress/ProgressHub";
import { PersonalRecordsScreen } from "./components/progress/PersonalRecordsScreen";
import { ExerciseProgressScreen } from "./components/progress/ExerciseProgressScreen";
import { MuscleBalanceScreen } from "./components/progress/MuscleBalanceScreen";
import { ProfileScreen } from "./components/profile/ProfileScreen";
import { ProfileSetupScreen } from "./components/profile/ProfileSetupScreen";
import { BodyweightHistoryScreen } from "./components/profile/BodyweightHistoryScreen";
import { AccountSettingsScreen } from "./components/settings/AccountSettingsScreen";

export const router = createBrowserRouter([
  { path: "/splash", Component: SplashScreen },
  { path: "/login", Component: LoginScreen },
  { path: "/register", Component: RegisterScreen },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "explore", Component: ExploreScreen },
      { path: "explore/:id", Component: ExerciseDetailScreen },
      { path: "train", Component: TrainHub },
      { path: "train/templates", Component: TemplateListScreen },
      { path: "train/templates/new", Component: TemplateBuilderScreen },
      { path: "train/templates/:id", Component: TemplateBuilderScreen },
      { path: "train/start", Component: StartWorkoutScreen },
      { path: "train/active", Component: ActiveWorkoutScreen },
      { path: "train/history", Component: WorkoutHistoryScreen },
      { path: "train/history/:id", Component: SessionDetailScreen },
      { path: "train/mesocycles", Component: MesocycleListScreen },
      { path: "train/mesocycles/:id", Component: MesocycleDetailScreen },
      { path: "progress", Component: ProgressHub },
      { path: "progress/records", Component: PersonalRecordsScreen },
      { path: "progress/exercise/:id", Component: ExerciseProgressScreen },
      { path: "progress/muscle-balance", Component: MuscleBalanceScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "profile/setup", Component: ProfileSetupScreen },
      { path: "profile/bodyweight", Component: BodyweightHistoryScreen },
      { path: "settings", Component: AccountSettingsScreen },
    ],
  },
]);
