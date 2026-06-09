import { View } from "react-native";
import { useAuth } from "@clerk/expo";
import { ExercisePicker } from "../components/ExercisePicker";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";

function ExploreScreen({ navigation }: { navigation: any }) {
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

export default ExploreScreen;
