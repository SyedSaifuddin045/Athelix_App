import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useAppConfigQuery, useExercisesQuery, usePersonalRecordsQuery } from "../api/queries";
import { RECORD_TYPES } from "../data";
import type { ExerciseResponse, PersonalRecordResponse } from "../api/model";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { formatShortDate } from "../utils/format";
import { exerciseLookup, recordValue } from "../utils/mapping";
import { muscleAccentColor } from "../utils/display";

function nameForExercise(id: string, lookup: Map<string, ExerciseResponse>) {
  return lookup.get(id)?.name ?? null;
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "PersonalRecords"> };

export function PersonalRecordsScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const appConfig = useAppConfigQuery();
  const records = usePersonalRecordsQuery(filter === "All" ? undefined : { record_type: filter }, isAuthenticated);
  const exercises = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(exercises.data?.items), [exercises.data?.items]);

  const grouped = useMemo(() => {
    const normalized = search.toLowerCase();
    const groups = new Map<string, PersonalRecordResponse[]>();
    (records.data ?? []).forEach((record) => {
      const name = nameForExercise(record.exercise_id, lookup);
      if (normalized && !(name ?? "").toLowerCase().includes(normalized) && !record.exercise_id.toLowerCase().includes(normalized)) return;
      groups.set(record.exercise_id, [...(groups.get(record.exercise_id) ?? []), record]);
    });
    return Array.from(groups.entries()).map(([exerciseId, items]) => ({ exerciseId, records: items }));
  }, [lookup, records.data, search]);

  const recordTypes = ["All", ...(appConfig.data?.supported_values.personal_record_types ?? RECORD_TYPES.filter((t) => t !== "All"))];

  return (
    <Screen>
      <BackHeader title="Personal Records" subtitle="Automatically tracked" onBack={() => navigation.goBack()} />

      <Card elevated style={{ marginTop: SPACING.xl3 }}>
        <Text style={[styles.stepText, { color: COLORS.muted }]}>
          PRs are automatically derived from completed sessions.
        </Text>
      </Card>

      <View style={[styles.searchWrap, { marginTop: SPACING.xl2, minHeight: 50, borderRadius: RADIUS.input, backgroundColor: COLORS.cardSoft, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.xl2, flexDirection: "row", alignItems: "center", gap: SPACING.lg }]}>
        <Icon name="award" size={14} color={COLORS.faint} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={COLORS.faint}
          style={[styles.searchInput, { flex: 1, color: COLORS.text, fontSize: 13, paddingVertical: 0 }]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, marginTop: SPACING.xl2 }}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterChip,
              {
                borderRadius: RADIUS.tag,
                borderWidth: 1,
                borderColor: filter === type ? "rgba(251,191,36,0.4)" : COLORS.border,
                backgroundColor: filter === type ? "rgba(251,191,36,0.2)" : COLORS.cardSoft,
                paddingHorizontal: SPACING.xl3,
                paddingVertical: SPACING.sm,
              },
            ]}
          >
            <Text style={[styles.filterChipText, filter === type ? { color: COLORS.gold } : { color: COLORS.muted }]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {records.isPending ? <LoadingCard label="Loading personal records..." /> : null}
      {records.isError ? <ErrorCard error={records.error} onRetry={() => records.refetch()} /> : null}

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl }}>
        {grouped.map((entry) => {
          const exercise = lookup.get(entry.exerciseId);
          return (
            <Card key={entry.exerciseId} elevated style={{ paddingVertical: 0 }}>
              <Pressable
                style={[styles.exerciseHeader, { flexDirection: "row", alignItems: "center", gap: SPACING.xl, paddingVertical: SPACING.xl2, paddingHorizontal: SPACING.xl3, borderBottomWidth: 1, borderBottomColor: COLORS.border }]}
                onPress={() => navigation.navigate("ExerciseProgress", { id: entry.exerciseId })}
              >
                <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(exercise?.target ?? exercise?.body_part) ?? COLORS.teal }} />
                <Text style={[styles.listRowTitle, { flex: 1 }]}>{nameForExercise(entry.exerciseId, lookup) ?? entry.exerciseId}</Text>
                <View style={styles.rowGapTiny}>
                  <Icon name="trending-up" size={13} color={COLORS.faint} />
                  <Icon name="chevron-right" size={13} color={COLORS.faint} />
                </View>
              </Pressable>
              <View style={{ paddingHorizontal: SPACING.xl3, paddingVertical: SPACING.xl2, gap: SPACING.lg }}>
                {entry.records.map((record) => (
                  <View key={record.id} style={styles.rowBetween}>
                    <View style={styles.rowGap}>
                      <View style={[styles.softIconWrap, { width: 34, height: 34, borderRadius: RADIUS.iconWrap, backgroundColor: "rgba(251,191,36,0.12)", alignItems: "center", justifyContent: "center" }]}>
                        <Icon name="award" size={13} color={COLORS.gold} />
                      </View>
                      <View>
                        <Text style={styles.smallStrongText}>{record.record_type}</Text>
                        <Text style={styles.listMeta}>{formatShortDate(record.achieved_on)}</Text>
                      </View>
                    </View>
                    <View style={styles.rowGap}>
                      <Text style={[styles.prValue, { color: COLORS.gold, fontSize: 16, fontWeight: "900" }]}>{recordValue(record)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          );
        })}
        {!records.isPending && grouped.length === 0 ? (
          <EmptyCard title="No records found" text="Complete workouts to generate records." />
        ) : null}
      </View>
    </Screen>
  );
}
