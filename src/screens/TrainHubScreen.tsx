import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { TRAIN_SECTIONS } from "../data";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { shadow } from "../utils/helpers";
import { Screen } from "../components/ui/Layout";
import { Card } from "../components/ui/Card";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard } from "../components/ui/Stats";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

export function TrainHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  return (
    <Screen>
      <View style={styles.tabIntro}>
        <SectionEyebrow>Train</SectionEyebrow>
        <Text style={styles.tabTitle}>Workouts</Text>
      </View>

      <Pressable onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })} style={{ marginTop: 18 }}>
        <View style={[styles.trainHero, shadow(COLORS.teal)]}>
          <View style={styles.trainHeroIcon}>
            <Feather name="play" size={24} color="#ffffff" />
          </View>
          <Text style={styles.trainHeroTitle}>Start Workout</Text>
          <Text style={styles.trainHeroSubtitle}>Begin now or choose a template</Text>
        </View>
      </Pressable>

      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Sessions" value={String(overview.data?.stats.completed_sessions ?? 0)} />
        <CompactStatCard label="Templates" value={String(overview.data?.stats.total_workout_templates ?? 0)} />
        <CompactStatCard label="PRs" value={String(overview.data?.stats.personal_record_count ?? 0)} />
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {TRAIN_SECTIONS.map((section) => {
          let badgeLabel = "badge" in section ? section.badge : "";
          if ("badgeKey" in section) {
            if (section.badgeKey === "templates") {
              badgeLabel = `${overview.data?.stats.total_workout_templates ?? 0} saved`;
            } else if (section.badgeKey === "sessions") {
              badgeLabel = `${overview.data?.stats.completed_sessions ?? 0} sessions`;
            }
          }
          return (
            <Pressable
              key={section.title}
              onPress={() => {
                if (section.title === "Templates") navigation.navigate({ name: "TemplateList", params: undefined });
                else if (section.title === "Workout History") navigation.navigate({ name: "WorkoutHistory", params: undefined });
                else if (section.title === "Mesocycles") navigation.navigate({ name: "MesocycleList", params: undefined });
              }}
            >
              <Card style={{ borderColor: "advanced" in section && section.advanced ? "rgba(139,92,246,0.2)" : COLORS.border }}>
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flexShrink: 1 }]}>
                    <View style={[styles.sectionIconWrapSmall, { backgroundColor: `${section.color}18` }]}>
                      {section.title === "Templates" ? <Feather name="book-open" size={18} color={section.color} /> : null}
                      {section.title === "Workout History" ? (
                        <MaterialCommunityIcons name="history" size={18} color={section.color} />
                      ) : null}
                      {section.title === "Mesocycles" ? <Feather name="trending-up" size={18} color={section.color} /> : null}
                    </View>
                    <View style={{ flex: 1, flexShrink: 1 }}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={styles.detailLabel}>{section.desc}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <Tag label={badgeLabel} color={"advanced" in section && section.advanced ? COLORS.purple : section.color} />
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
