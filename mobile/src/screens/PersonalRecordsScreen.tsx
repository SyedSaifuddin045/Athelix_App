import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useAppConfigQuery, useExercisesQuery, usePersonalRecordsQuery } from "../api/queries";
import { RECORD_TYPES } from "../data";
import type { ExerciseResponse, PersonalRecordResponse } from "../api/model";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { formatShortDate } from "../utils/format";
import { exerciseLookup, recordValue } from "../utils/mapping";
import { exerciseEmoji } from "../utils/display";

function nameForExercise(id: string, lookup: Map<string, ExerciseResponse>) {
  return lookup.get(id)?.name ?? null;
}

export function PersonalRecordsScreen({ navigation }: { navigation: any }) {
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
  const recordTypes = ["All", ...(appConfig.data?.supported_values.personal_record_types ?? RECORD_TYPES.filter((type) => type !== "All"))];

  return (
    <Screen>
      <BackHeader title="Personal Records" subtitle="Automatically tracked" onBack={() => navigation.goBack()} />

      <Card style={{ marginTop: 18 }}>
        <Text style={styles.stepText}>
          PRs are automatically derived from completed sessions.
        </Text>
      </Card>

      <View style={[styles.searchWrap, { marginTop: 14 }]}>
        <Feather name="award" size={14} color="rgba(255,255,255,0.35)" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor="rgba(255,255,255,0.32)"
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 14 }}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterChip,
              filter === type ? { backgroundColor: "rgba(251,191,36,0.2)", borderColor: "rgba(251,191,36,0.4)" } : null,
            ]}
          >
            <Text style={[styles.filterChipText, filter === type ? { color: COLORS.gold } : null]}>{type}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {records.isPending ? <LoadingCard label="Loading personal records..." /> : null}
      {records.isError ? <ErrorCard error={records.error} onRetry={() => records.refetch()} /> : null}

      <View style={{ marginTop: 16, gap: 12 }}>
        {grouped.map((entry) => {
          const exercise = lookup.get(entry.exerciseId);
          return (
          <Card key={entry.exerciseId} style={{ paddingVertical: 0 }}>
            <Pressable style={styles.exerciseHeader} onPress={() => navigation.navigate("ExerciseProgress", { id: entry.exerciseId })}>
              <Text style={{ fontSize: 20 }}>{exerciseEmoji(exercise)}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{nameForExercise(entry.exerciseId, lookup) ?? entry.exerciseId}</Text>
              <View style={styles.rowGapTiny}>
                <Feather name="trending-up" size={13} color="rgba(255,255,255,0.32)" />
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.22)" />
              </View>
            </Pressable>
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
              {entry.records.map((record) => (
                  <View key={record.id} style={styles.rowBetween}>
                    <View style={styles.rowGap}>
                      <View style={[styles.softIconWrap, { backgroundColor: "rgba(251,191,36,0.12)" }]}>
                        <Feather name="award" size={13} color={COLORS.gold} />
                      </View>
                      <View>
                        <Text style={styles.smallStrongText}>{record.record_type}</Text>
                        <Text style={styles.listMeta}>{formatShortDate(record.achieved_on)}</Text>
                      </View>
                    </View>
                    <View style={styles.rowGap}>
                      <Text style={[styles.prValue, { color: COLORS.gold }]}>{recordValue(record)}</Text>
                    </View>
                  </View>
                ))}
            </View>
          </Card>
          );
        })}
        {!records.isPending && grouped.length === 0 ? <EmptyCard title="No records found" text="Complete workouts to generate records." /> : null}
      </View>
    </Screen>
  );
}
