import { useAuth } from "@clerk/expo";
import { Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@tamagui/core";
import type { RootStackParamList } from "../types/navigation";
import { ExercisePicker } from "../components/ExercisePicker";
import { Screen } from "../components/ui/Layout";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

export function ExploreScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";

  if (!isAuthenticated) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: mutedColor, fontSize: 14, textAlign: "center" }}>
            Sign in to browse exercises
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ExercisePicker
        variant="browse"
        title="Exercise Library"
        enabled={isAuthenticated}
        onNavigate={(exerciseId) => navigation.navigate("ExerciseDetail", { id: exerciseId })}
      />
    </Screen>
  );
}
