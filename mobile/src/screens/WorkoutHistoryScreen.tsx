import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../auth/AuthProvider";
import { useSessionsQuery } from "../api/queries";
import type { WorkoutSessionResponse } from "../api/model";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { Tag, SectionEyebrow } from "../components/ui/Indicators";
import { CompactStatCard, MetaInline } from "../components/ui/Stats";
import { workoutTitle } from "../utils/display";
import { formatDateLabel, formatShortDate, formatTimeLabel } from "../utils/format";

export function WorkoutHistoryScreen({ navigation }: { navigation: any }) {
  const auth = useAuth();
  const sessions = useSessionsQuery(auth.isAuthenticated);
  const totalVolume = (sessions.data ?? []).reduce((sum, session) => sum + (session.total_volume ?? 0), 0);
  const grouped = useMemo(() => {
    return (sessions.data ?? []).reduce<Record<string, WorkoutSessionResponse[]>>((acc, session) => {
      const key = formatDateLabel(session.started_at);
      acc[key] = [...(acc[key] ?? []), session];
      return acc;
    }, {});
  }, [sessions.data]);

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader title="Workout History" subtitle={`${sessions.data?.length ?? 0} sessions`} onBack={() => navigation.goBack()} />
      <View style={[styles.threeUpGrid, { marginTop: 18 }]}>
        <CompactStatCard label="Total Sessions" value={String(sessions.data?.length ?? 0)} />
        <CompactStatCard label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} />
        <CompactStatCard label="Completed" value={String((sessions.data ?? []).filter((session) => session.is_completed).length)} />
      </View>
      {sessions.isPending ? <LoadingCard label="Loading history..." /> : null}
      {sessions.isError ? <ErrorCard error={sessions.error} onRetry={() => sessions.refetch()} /> : null}
      <View style={{ marginTop: 18, gap: 18 }}>
        {Object.entries(grouped).map(([week, weekSessions]) => (
          <View key={week}>
            <SectionEyebrow>{week}</SectionEyebrow>
            <View style={{ gap: 10, marginTop: 12 }}>
              {weekSessions.map((session) => (
                <Pressable key={session.id} onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
                  <Card style={styles.listRowCard}>
                    <View style={styles.historyMoodWrap}>
                      <Text style={{ fontSize: 18 }}>{session.mood ?? "✓"}</Text>
                    </View>
                    <View style={styles.listRowBody}>
                      <Text style={styles.listRowTitle}>{workoutTitle(session)}</Text>
                      <Text style={styles.detailLabel}>
                        {formatShortDate(session.started_at)} - {formatTimeLabel(session.started_at)}
                      </Text>
                      <View style={[styles.rowGapLarge, { marginTop: 6 }]}>
                        <MetaInline icon={<Feather name="clock" size={10} color="rgba(255,255,255,0.3)" />} text={`${session.duration_minutes ?? 0}m`} />
                        <MetaInline
                          icon={<MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.3)" />}
                          text={`${session.total_sets ?? 0} sets`}
                        />
                        {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR`} color={COLORS.gold} /> : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.22)" />
                  </Card>
                </Pressable>
              ))}
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
