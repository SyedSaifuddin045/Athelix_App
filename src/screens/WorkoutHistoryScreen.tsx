import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useSessionsQuery } from "../api/queries";
import type { WorkoutSessionResponse } from "../api/model";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard, MetaInline } from "../components/ui/Stats";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";
import { workoutTitle } from "../utils/display";
import { formatDateLabel, formatShortDate, formatTimeLabel } from "../utils/format";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "WorkoutHistory"> };

const MOOD_ICONS: Record<string, IconName> = {
  Tired: "sleep",
  Okay: "meh",
  Good: "smile",
  Strong: "zap",
  Beast: "flame",
};

export function WorkoutHistoryScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const blueColor = theme.colorBlue?.get() ?? "#3B82F6";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const sessions = useSessionsQuery(isAuthenticated);
  const totalVolume = (sessions.data ?? []).reduce((sum, session) => sum + (session.total_volume ?? 0), 0);
  const grouped = useMemo(() => {
    return (sessions.data ?? []).reduce<Record<string, WorkoutSessionResponse[]>>((acc, session) => {
      const key = formatDateLabel(session.started_at);
      acc[key] = [...(acc[key] ?? []), session];
      return acc;
    }, {});
  }, [sessions.data]);

  return (
    <Screen>
      <BackHeader title="Workout History" subtitle={`${sessions.data?.length ?? 0} sessions`} onBack={() => navigation.goBack()} />

      <View style={[{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.xl3 }]}>
        <CompactStatCard icon="list-checks" label="Total Sessions" value={String(sessions.data?.length ?? 0)} color={accent} />
        <CompactStatCard icon="gauge" label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} color={blueColor} />
        <CompactStatCard icon="check-circle" label="Completed" value={String((sessions.data ?? []).filter((s) => s.is_completed).length)} color={greenColor} />
      </View>

      {sessions.isPending ? <LoadingCard label="Loading history..." /> : null}
      {sessions.isError ? <ErrorCard error={sessions.error} onRetry={() => sessions.refetch()} /> : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl3 }}>
        {Object.entries(grouped).map(([week, weekSessions]) => (
          <View key={week}>
            <SectionEyebrow>{week}</SectionEyebrow>
            <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
              {weekSessions.map((session) => {
                const moodIcon = session.mood ? MOOD_ICONS[session.mood] : null;
                return (
                  <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
                    <Card elevated style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
                      <View style={{ width: 44, height: 44, borderRadius: radii.iconWrap, backgroundColor: surface2Color, alignItems: "center", justifyContent: "center" }}>
                        {moodIcon ? (
                          <AppIcon name={moodIcon} size={20} color={accent} />
                        ) : (
                          <AppIcon name="check" size={20} color={mutedColor} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: "700" }}>{workoutTitle(session)}</Text>
                        <Text style={{ color: mutedColor, fontSize: 11, lineHeight: 16 }}>
                          {formatShortDate(session.started_at)} - {formatTimeLabel(session.started_at)}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: spacing.sm }}>
                          <MetaInline icon="clock" label={`${session.duration_minutes ?? 0}m`} />
                          <MetaInline icon="list-checks" label={`${session.total_sets ?? 0} sets`} />
                          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR`} color={goldColor} /> : null}
                        </View>
                      </View>
                      <AppIcon name="chevron-right" size={14} color={faintColor} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {!sessions.isPending && (sessions.data?.length ?? 0) === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
            <Text style={{ color: textColor, fontSize: 15, fontWeight: "700" }}>No workouts yet</Text>
            <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Start a workout to populate your history.</Text>
            <PrimaryButton
              label="Start Your First Workout"
              onPress={() => navigation.navigate("StartWorkout", {})}
              icon={<AppIcon name="dumbbell" size={16} color="#000000" />}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
