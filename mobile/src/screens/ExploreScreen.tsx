import { View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ExercisePicker } from "../components/ExercisePicker";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";

function ExploreScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  return (
    <Screen scroll={false} contentContainerStyle={styles.scrollContent}>
      <ExercisePicker
        variant="browse"
        title="Exercise Library"
        enabled={auth.isAuthenticated}
        onNavigate={(exerciseId) => navigation.navigate("ExerciseDetail", { id: exerciseId })}
      />
    </Screen>
  );
}

export default ExploreScreen;
