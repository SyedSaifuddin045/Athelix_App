import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { TRAIN_SECTIONS } from "../data";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { shadows } from "../design-system/tokens/shadows";
import { Card } from "../components/ui/Card";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard } from "../components/ui/Stats";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";
import { Screen } from "../components/ui/Layout";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const SECTION_ICONS: Record<string, IconName> = {
  Templates: "book-open",
  "Workout History": "history",
  Mesocycles: "trending-up",
};

export function TrainHubScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const blueColor = theme.colorBlue?.get() ?? "#3B82F6";
  const purpleColor = theme.colorPurple?.get() ?? "#A855F7";
  const overview = useOverviewQuery(isAuthenticated);
  return (
    <Screen>
      <View style={{ paddingTop: 8 }}>
        <SectionEyebrow>Train</SectionEyebrow>
        <Text style={{ color: textColor, fontSize: 28, fontWeight: "900", marginTop: 4 }}>Workouts</Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate({ name: "StartWorkout", params: {} })}
        style={{ marginTop: spacing.xl3 }}
      >
        <View
          style={[
            {
              borderRadius: 28,
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 28,
              backgroundColor: accent,
            },
            shadows.glow(accent),
          ]}
        >
          <View style={{ width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" }}>
            <AppIcon name="play" size={24} color="#ffffff" />
          </View>
          <Text style={{ color: "#000000", fontSize: 18, fontWeight: "900", marginTop: 14 }}>Start Workout</Text>
          <Text style={{ color: "rgba(0,0,0,0.55)", fontSize: 12, marginTop: 4 }}>Begin now or choose a template</Text>
        </View>
      </Pressable>

      <View style={[{ flexDirection: "row", gap: 10, marginTop: spacing.xl3 }]}>
        <CompactStatCard
          icon="list-checks"
          label="Sessions"
          value={String(overview.data?.stats.completed_sessions ?? 0)}
          color={accent}
        />
        <CompactStatCard
          icon="book-open"
          label="Templates"
          value={String(overview.data?.stats.total_workout_templates ?? 0)}
          color={blueColor}
        />
        <CompactStatCard
          icon="award"
          label="PRs"
          value={String(overview.data?.stats.personal_record_count ?? 0)}
          color={goldColor}
        />
      </View>

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
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
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, { flex: 1 }]}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: `${section.color}18`,
                      }}
                    >
                      <AppIcon
                        name={SECTION_ICONS[section.title] ?? "circle"}
                        size={18}
                        color={section.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>{section.title}</Text>
                      <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>{section.desc}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                    <Tag
                      label={badgeLabel}
                      color={isAdvanced ? purpleColor : section.color}
                    />
                    <AppIcon name="chevron-right" size={14} color={faintColor} />
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
