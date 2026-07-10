import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, SectionList, Text, TouchableOpacity, View } from "react-native";
import { usePressOpacity } from "../utils/usePressOpacity";
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

const SKELETON_COLOR = "rgba(255,255,255,0.1)";

function WorkoutHistorySkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const S = ({ w, h, r = 8 }: { w?: number | string; h: number; r?: number }) => (
    <Animated.View style={{ opacity, width: w as any, height: h, borderRadius: r, backgroundColor: SKELETON_COLOR }} />
  );

  return (
    <View style={{ marginTop: spacing.xl3, gap: spacing.xl3 }}>
      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <View style={{ flex: 1, gap: spacing.xs, backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.lg }}>
          <S w={40} h={14} />
          <S h={10} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs, backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.lg }}>
          <S w={44} h={14} />
          <S h={10} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs, backgroundColor: SKELETON_COLOR, borderRadius: radii.modal, padding: spacing.lg }}>
          <S w={36} h={14} />
          <S h={10} />
        </View>
      </View>
      <S h={14} w={80} />
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            backgroundColor: SKELETON_COLOR,
            borderRadius: radii.modal,
            padding: spacing.lg,
          }}
        >
          <S w={44} h={44} r={22} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <S w="60%" h={13} />
            <S w="40%" h={10} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <S w={60} h={10} />
              <S w={50} h={10} />
            </View>
          </View>
          <S w={14} h={14} />
        </View>
      ))}
    </View>
  );
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "WorkoutHistory"> };

const MOOD_ICONS: Record<string, IconName> = {
  Tired: "sleep",
  Okay: "meh",
  Good: "smile",
  Strong: "zap",
  Beast: "flame",
};

const SessionCard = memo(function SessionCard({
  session,
  navigation,
  accent,
  textColor,
  mutedColor,
  faintColor,
  surface2Color,
  goldColor,
}: {
  session: WorkoutSessionResponse;
  navigation: NativeStackNavigationProp<RootStackParamList, "WorkoutHistory">;
  accent: string;
  textColor: string;
  mutedColor: string;
  faintColor: string;
  surface2Color: string;
  goldColor: string;
}) {
  const moodIcon = session.mood ? MOOD_ICONS[session.mood] : null;
  return (
    <Pressable onPress={() => navigation.navigate("SessionDetail", { id: String(session.id) })}>
      <Card elevated style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.md }}>
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
});

export function WorkoutHistoryScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const theme = useTheme();
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.55)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";
  const blueColor = theme.colorBlue?.get() ?? "#3B82F6";
  const greenColor = theme.colorGreen?.get() ?? "#22C55E";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const press = usePressOpacity();
  const sessions = useSessionsQuery(isAuthenticated);
  const totalVolume = useMemo(() => (sessions.data ?? []).reduce((sum, session) => sum + (session.total_volume ?? 0), 0), [sessions.data]);

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const sessionsByDate = useMemo(() => {
    const map: Record<string, WorkoutSessionResponse[]> = {};
    for (const session of sessions.data ?? []) {
      const dateStr = session.started_at.slice(0, 10);
      map[dateStr] = [...(map[dateStr] ?? []), session];
    }
    return map;
  }, [sessions.data]);

  const filteredSessions = useMemo(() => {
    if (!selectedDate) return sessions.data;
    return (sessions.data ?? []).filter((s) => s.started_at.slice(0, 10) === selectedDate);
  }, [sessions.data, selectedDate]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const gridCells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    if (day < 1 || day > totalDaysInMonth) return null;
    return day;
  });

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const grouped = useMemo(() => {
    return (filteredSessions ?? []).reduce<Record<string, WorkoutSessionResponse[]>>((acc, session) => {
      const key = formatDateLabel(session.started_at);
      acc[key] = [...(acc[key] ?? []), session];
      return acc;
    }, {});
  }, [filteredSessions]);

  const handleDayPress = useCallback(
    (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    },
    [year, month],
  );

  const screenBg = theme.background?.get() ?? "#050505";

  const sections = useMemo(
    () => Object.entries(grouped).map(([title, data]) => ({ title, data })),
    [grouped],
  );

  const renderSessionCard = useCallback(
    ({ item }: { item: WorkoutSessionResponse }) => (
      <SessionCard
        session={item}
        navigation={navigation}
        accent={accent}
        textColor={textColor}
        mutedColor={mutedColor}
        faintColor={faintColor}
        surface2Color={surface2Color}
        goldColor={goldColor}
      />
    ),
    [navigation, accent, textColor, mutedColor, faintColor, surface2Color, goldColor],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <View style={{ paddingTop: spacing.xl3, paddingBottom: spacing.md }}>
        <SectionEyebrow>{section.title}</SectionEyebrow>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: WorkoutSessionResponse) => String(item.id), []);

  if (sessions.isPending) {
    return (
      <Screen>
        <BackHeader title="Workout History" onBack={() => navigation.goBack()} />
        <WorkoutHistorySkeleton />
      </Screen>
    );
  }

  if (sessions.isError) {
    return (
      <Screen>
        <BackHeader title="Workout History" onBack={() => navigation.goBack()} />
        <ErrorCard error={sessions.error} onRetry={() => sessions.refetch()} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderSessionCard}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <View>
            <BackHeader
              title="Workout History"
              subtitle={`${sessions.data?.length ?? 0} sessions`}
              onBack={() => navigation.goBack()}
              right={
                <TouchableOpacity
                  onPress={() => {
                    setViewMode((v) => (v === "list" ? "calendar" : "list"));
                    if (viewMode === "calendar") setSelectedDate(null);
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: surface2Color,
                    borderWidth: 1,
                    borderColor: theme.borderColor?.get() ?? "rgba(255,255,255,0.09)",
                  }}
                >
                  <AppIcon name={viewMode === "list" ? "calendar" : "list"} size={16} color={accent} />
                </TouchableOpacity>
              }
            />

            <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.xl3 }}>
              <CompactStatCard icon="list-checks" label="Total Sessions" value={String(sessions.data?.length ?? 0)} color={accent} />
              <CompactStatCard icon="gauge" label="Total Volume" value={`${Math.round(totalVolume / 1000)}k kg`} color={blueColor} />
              <CompactStatCard icon="check-circle" label="Completed" value={String((sessions.data ?? []).filter((s) => s.is_completed).length)} color={greenColor} />
            </View>

            {viewMode === "calendar" ? (
              <View style={{ marginTop: spacing.xl3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
                  <TouchableOpacity onPress={goToPrevMonth} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="chevron-left" size={16} color={mutedColor} />
                  </TouchableOpacity>
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: "700" }}>{monthLabel}</Text>
                  <TouchableOpacity onPress={goToNextMonth} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="chevron-right" size={16} color={mutedColor} />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", marginBottom: spacing.xs }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <View key={d} style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ color: mutedColor, fontSize: 10, fontWeight: "600" }}>{d}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {gridCells.map((day, i) => {
                    if (day === null) {
                      return (
                        <View
                          key={`empty-${i}`}
                          style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" }}
                        />
                      );
                    }
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasSession = !!sessionsByDate[dateStr];
                    const isSelected = selectedDate === dateStr;

                    return (
                      <Animated.View key={dateStr} style={{ opacity: press.opacity, width: `${100 / 7}%`, aspectRatio: 1 }}>
                        <Pressable
                          onPress={() => handleDayPress(day)}
                          onPressIn={press.onPressIn}
                          onPressOut={press.onPressOut}
                          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                        >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: isSelected ? accent : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: isSelected ? "#FFFFFF" : hasSession ? textColor : faintColor,
                              fontSize: 13,
                              fontWeight: isSelected ? "700" : "400",
                            }}
                          >
                            {day}
                          </Text>
                        </View>
                        {hasSession ? (
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: isSelected ? "#FFFFFF" : accent,
                              marginTop: 2,
                            }}
                          />
                        ) : null}
                      </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          (sessions.data?.length ?? 0) === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: "700" }}>No workouts yet</Text>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>Start a workout to populate your history.</Text>
              <PrimaryButton
                label="Start Your First Workout"
                onPress={() => navigation.navigate("StartWorkout", {})}
                icon={<AppIcon name="dumbbell" size={16} color="#000000" />}
              />
            </View>
          ) : selectedDate && (filteredSessions?.length ?? 0) === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <Text style={{ color: mutedColor, fontSize: 13, textAlign: "center" }}>No workouts on this day.</Text>
            </View>
          ) : null
        }
        ListHeaderComponentStyle={{ paddingBottom: 24 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}
