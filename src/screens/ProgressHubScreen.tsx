import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useOverviewQuery } from "../api/queries";
import { COLORS } from "../theme/colors";
import { SPACING } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Indicators";
import { Screen } from "../components/ui/Layout";
import { SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard } from "../components/ui/Stats";
import { PROGRESS_SECTIONS } from "../data";
import { recordValue } from "../utils/mapping";
import { formatShortDate } from "../utils/format";
import { Icon, type IconName } from "../components/ui/Icon";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const SECTION_ICONS: Record<string, IconName> = {
  personalRecords: "award",
  exerciseProgress: "trending-up",
  muscleBalance: "bar-chart-2",
};

export function ProgressHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const latestPr = overview.data?.recent_personal_records[0];

  return (
    <Screen>
      <View style={styles.tabIntro}>
        <SectionEyebrow>Analytics</SectionEyebrow>
        <Text style={styles.tabTitle}>Progress</Text>
      </View>

      <View style={[{ marginTop: SPACING.xl3, flexDirection: "row", gap: SPACING.lg }]}>
        <CompactStatCard
          icon="award"
          label="PRs"
          value={String(overview.data?.stats.personal_record_count ?? 0)}
          color={COLORS.gold}
        />
        <CompactStatCard
          icon="list-checks"
          label="Sessions"
          value={String(overview.data?.stats.completed_sessions ?? 0)}
          color={COLORS.teal}
        />
        <CompactStatCard
          icon="flame"
          label="Streak"
          value={String(overview.data?.workout_streaks.current_daily_streak ?? 0)}
          color={COLORS.green}
        />
      </View>

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
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
                if (section.path === "personalRecords")
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
                <View style={styles.rowBetween}>
                  <View style={[styles.rowGap, { flex: 1 }]}>
                    <View
                      style={[
                        styles.sectionIconWrap,
                        {
                          width: 52,
                          height: 52,
                          borderRadius: 18,
                          backgroundColor: `${section.color}16`,
                        },
                      ]}
                    >
                      <Icon
                        name={SECTION_ICONS[section.path] ?? "circle"}
                        size={22}
                        color={section.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                      <Text style={[styles.detailLabel, { marginTop: SPACING.xxs }]}>
                        {section.desc}
                      </Text>
                      <Tag label={badgeLabel} color={section.color} />
                    </View>
                  </View>
                  <Icon name="chevron-right" size={16} color={COLORS.faint} />
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {latestPr ? (
        <Card
          elevated
          accent="gold"
          style={{ marginTop: SPACING.xl3 }}
        >
          <View style={styles.rowGap}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "rgba(251,191,36,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="trophy" size={22} color={COLORS.gold} />
            </View>
            <View>
              <Text style={[styles.listRowTitle, { color: COLORS.gold }]}>
                New {latestPr.record_type} PR
              </Text>
              <Text style={styles.detailLabel}>
                {recordValue(latestPr)} - {formatShortDate(latestPr.achieved_on)}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
