import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { TRAIN_SECTIONS } from "../data";
import { COLORS } from "../theme/colors";
import { SPACING, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Screen } from "../components/ui/Layout";
import { Card } from "../components/ui/Card";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard } from "../components/ui/Stats";
import { Icon, type IconName } from "../components/ui/Icon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const SECTION_ICONS: Record<string, IconName> = {
  Templates: "book-open",
  "Workout History": "history",
  Mesocycles: "trending-up",
};

export function TrainHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  return (
    <Screen>
      <View style={styles.tabIntro}>
        <SectionEyebrow>Train</SectionEyebrow>
        <Text style={styles.tabTitle}>Workouts</Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })}
        style={{ marginTop: SPACING.xl3 }}
      >
        <View
          style={[
            styles.trainHero,
            SHADOWS.glow(COLORS.teal),
            { backgroundColor: COLORS.teal, borderRadius: 28 },
          ]}
        >
          <View style={styles.trainHeroIcon}>
            <Icon name="play" size={24} color="#ffffff" />
          </View>
          <Text style={styles.trainHeroTitle}>Start Workout</Text>
          <Text style={styles.trainHeroSubtitle}>Begin now or choose a template</Text>
        </View>
      </Pressable>

      <View style={[styles.threeUpGrid, { marginTop: SPACING.xl3, gap: SPACING.lg }]}>
        <CompactStatCard
          icon="list-checks"
          label="Sessions"
          value={String(overview.data?.stats.completed_sessions ?? 0)}
          color={COLORS.teal}
        />
        <CompactStatCard
          icon="book-open"
          label="Templates"
          value={String(overview.data?.stats.total_workout_templates ?? 0)}
          color={COLORS.blue}
        />
        <CompactStatCard
          icon="award"
          label="PRs"
          value={String(overview.data?.stats.personal_record_count ?? 0)}
          color={COLORS.gold}
        />
      </View>

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        {TRAIN_SECTIONS.map((section) => {
          let badgeLabel = "badge" in section ? section.badge : "";
          if ("badgeKey" in section) {
            if (section.badgeKey === "templates") {
              badgeLabel = `${overview.data?.stats.total_workout_templates ?? 0} saved`;
            } else if (section.badgeKey === "sessions") {
              badgeLabel = `${overview.data?.stats.completed_sessions ?? 0} sessions`;
            }
          }
          const isAdvanced = "advanced" in section && section.advanced;
          return (
            <Pressable
              key={section.title}
              onPress={() => {
                if (section.title === "Templates")
                  navigation.navigate({ name: "TemplateList", params: undefined });
                else if (section.title === "Workout History")
                  navigation.navigate({ name: "WorkoutHistory", params: undefined });
                else if (section.title === "Mesocycles")
                  navigation.navigate({ name: "MesocycleList", params: undefined });
              }}
            >
              <Card elevated accent={isAdvanced ? "purple" : "none"}>
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <View
                      style={[
                        styles.sectionIconWrapSmall,
                        { backgroundColor: `${section.color}18` },
                      ]}
                    >
                      <Icon
                        name={SECTION_ICONS[section.title] ?? "circle"}
                        size={18}
                        color={section.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={styles.detailLabel}>{section.desc}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: SPACING.sm }}>
                    <Tag
                      label={badgeLabel}
                      color={isAdvanced ? COLORS.purple : section.color}
                    />
                    <Icon name="chevron-right" size={14} color={COLORS.faint} />
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
