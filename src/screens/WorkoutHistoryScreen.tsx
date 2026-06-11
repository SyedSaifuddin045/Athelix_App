import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useSessionsQuery } from "../api/queries";
import type { WorkoutSessionResponse } from "../api/model";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard, MetaInline } from "../components/ui/Stats";
import { Icon, type IconName } from "../components/ui/Icon";
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

      <View style={[{ flexDirection: "row", gap: SPACING.lg, marginTop: SPACING.xl3 }]}>
        <CompactStatCard icon="list-checks" label="Total Sessions" value={String(sessions.data?.length ?? 0)} color={COLORS.teal} />
        <CompactStatCard icon="gauge" label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} color={COLORS.blue} />
        <CompactStatCard icon="check-circle" label="Completed" value={String((sessions.data ?? []).filter((s) => s.is_completed).length)} color={COLORS.green} />
      </View>

      {sessions.isPending ? <LoadingCard label="Loading history..." /> : null}
      {sessions.isError ? <ErrorCard error={sessions.error} onRetry={() => sessions.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl3 }}>
        {Object.entries(grouped).map(([week, weekSessions]) => (
          <View key={week}>
            <SectionEyebrow>{week}</SectionEyebrow>
            <View style={{ gap: SPACING.lg, marginTop: SPACING.xl }}>
              {weekSessions.map((session) => {
                const moodIcon = session.mood ? MOOD_ICONS[session.mood] : null;
                return (
                  <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
                    <Card elevated style={[styles.listRowCard, { flexDirection: "row", alignItems: "center", gap: SPACING.lg }]}>
                      <View style={[styles.historyMoodWrap, { width: 44, height: 44, borderRadius: RADIUS.iconWrap, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
                        {moodIcon ? (
                          <Icon name={moodIcon} size={20} color={COLORS.teal} />
                        ) : (
                          <Icon name="check" size={20} color={COLORS.muted} />
                        )}
                      </View>
                      <View style={[styles.listRowBody, { flex: 1 }]}>
                        <Text style={styles.listRowTitle}>{workoutTitle(session)}</Text>
                        <Text style={styles.detailLabel}>
                          {formatShortDate(session.started_at)} - {formatTimeLabel(session.started_at)}
                        </Text>
                        <View style={[styles.rowGapLarge, { marginTop: SPACING.sm, gap: SPACING.lg }]}>
                          <MetaInline icon="clock" label={`${session.duration_minutes ?? 0}m`} />
                          <MetaInline icon="list-checks" label={`${session.total_sets ?? 0} sets`} />
                          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR`} color={COLORS.gold} /> : null}
                        </View>
                      </View>
                      <Icon name="chevron-right" size={14} color={COLORS.faint} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {!sessions.isPending && (sessions.data?.length ?? 0) === 0 ? (
          <EmptyCard title="No workouts yet" text="Start a workout to populate your history." />
        ) : null}
      </View>
    </Screen>
  );
}
