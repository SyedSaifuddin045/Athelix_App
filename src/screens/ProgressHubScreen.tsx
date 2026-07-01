import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useOverviewQuery } from "../api/queries";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { Card } from "../components/ui/Card";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { Screen } from "../components/ui/Layout";
import { CompactStatCard } from "../components/ui/Stats";
import { PROGRESS_SECTIONS } from "../data";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const SECTION_ICONS: Record<string, IconName> = {
  achievements: "trophy",
  personalRecords: "award",
  exerciseProgress: "trending-up",
  muscleBalance: "bar-chart-2",
};

export function ProgressHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const overview = useOverviewQuery(isAuthenticated);

  return (
    <Screen>
      <View style={{ paddingTop: 8 }}>
        <SectionEyebrow>Analytics</SectionEyebrow>
        <Text style={{ color: textColor, fontSize: 28, fontWeight: "900", marginTop: 4 }}>Progress</Text>
      </View>

      <View style={[{ marginTop: spacing.xl3, flexDirection: "row", gap: spacing.lg }]}>
        <CompactStatCard
          icon="award"
          label="PRs"
          value={String(overview.data?.stats.personal_record_count ?? 0)}
          color={goldColor}
        />
        <CompactStatCard
          icon="list-checks"
          label="Sessions"
          value={String(overview.data?.stats.completed_sessions ?? 0)}
          color={accent}
        />
        <CompactStatCard
          icon="flame"
          label="Streak"
          value={String(overview.data?.workout_streaks.current_daily_streak ?? 0)}
          color={greenColor}
        />
      </View>

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
        {PROGRESS_SECTIONS.map((section) => {
          let badgeLabel = "badge" in section ? section.badge : "";
          if ("badgeKey" in section) {
            if (section.badgeKey === "prs") {
              badgeLabel = `${overview.data?.stats.personal_record_count ?? 0} PRs total`;
            } else if (section.badgeKey === "exercises") {
              badgeLabel = `${overview.data?.stats.tracked_exercises_count ?? 0} exercises tracked`;
            }
          }
          return (
            <Pressable
              key={section.title}
              onPress={() => {
                if (section.path === "achievements")
                  navigation.navigate({ name: "Achievements", params: undefined });
                else if (section.path === "personalRecords")
                  navigation.navigate({ name: "PersonalRecords", params: undefined });
                else if (section.path === "exerciseProgress")
                  navigation.navigate({ name: "ExerciseProgress", params: {} });
                else if (section.path === "muscleBalance")
                  navigation.navigate({ name: "MuscleBalance", params: undefined });
              }}
            >
              <Card
                elevated
                style={{
                  borderColor: `${section.color}22`,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { flex: 1 }]}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${section.color}16`,
                      }}
                    >
                      <AppIcon
                        name={SECTION_ICONS[section.path] ?? "circle"}
                        size={22}
                        color={section.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{section.title}</Text>
                      <Text style={[{ color: mutedColor, fontSize: 11, lineHeight: 16 }, { marginTop: spacing.xxs }]}>
                        {section.desc}
                      </Text>
                      <Tag label={badgeLabel} color={section.color} />
                    </View>
                  </View>
                  <AppIcon name="chevron-right" size={16} color={faintColor} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
