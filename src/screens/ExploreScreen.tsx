import { View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { ExercisePicker } from "../components/ExercisePicker";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

export function ExploreScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  return (
    <Screen scroll={false} contentContainerStyle={styles.scrollContent}>
      <ExercisePicker
        variant="browse"
        title="Exercise Library"
        enabled={isAuthenticated}
        onNavigate={(exerciseId) => navigation.navigate("ExerciseDetail", { id: exerciseId })}
      />
    </Screen>
  );
}
