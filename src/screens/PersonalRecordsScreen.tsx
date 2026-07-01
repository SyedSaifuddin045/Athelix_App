import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useTheme } from "@tamagui/core";
import { useAppConfigQuery, useExercisesQuery, usePersonalRecordsQuery } from "../api/queries";
import { RECORD_TYPES } from "../data";
import type { ExerciseResponse, PersonalRecordResponse } from "../api/model";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Card, EmptyCard, ErrorCard, LoadingCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";
import { formatShortDate } from "../utils/format";
import { exerciseLookup, recordValue } from "../utils/mapping";
import { muscleAccentColor } from "../utils/display";

function nameForExercise(id: string, lookup: Map<string, ExerciseResponse>) {
  return lookup.get(id)?.name ?? null;
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "PersonalRecords"> };

export function PersonalRecordsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const appConfig = useAppConfigQuery();
  const records = usePersonalRecordsQuery(filter === "All" ? undefined : { record_type: filter }, isAuthenticated);
  const exercises = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(exercises.data?.items), [exercises.data?.items]);

  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const borderColor = theme.borderColor?.get() ?? "rgba(255,255,255,0.08)";
  const surface2Color = theme.surface2?.get() ?? "rgba(255,255,255,0.06)";
  const goldColor = theme.colorGold?.get() ?? "#FBBF24";

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

      <Card elevated style={{ marginTop: spacing.xl3 }}>
        <Text style={{ flex: 1, color: mutedColor, fontSize: 13, lineHeight: 20 }}>
          PRs are automatically derived from completed sessions.
        </Text>
      </Card>

      <View style={{ marginTop: spacing.xl2, minHeight: 50, borderRadius: radii.input, backgroundColor: surface2Color, borderWidth: 1, borderColor, paddingHorizontal: spacing.xl2, flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <AppIcon name="award" size={14} color={faintColor} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor={faintColor}
          style={{ flex: 1, color: textColor, fontSize: 13, paddingVertical: 0 }}
        />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.xl }}>
        {recordTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: filter === type ? "rgba(251,191,36,0.4)" : borderColor,
              backgroundColor: filter === type ? "rgba(251,191,36,0.2)" : surface2Color,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: filter === type ? goldColor : mutedColor, fontSize: 11, fontWeight: "700" }}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      {records.isPending ? <LoadingCard label="Loading personal records..." /> : null}
      {records.isError ? <ErrorCard error={records.error} onRetry={() => records.refetch()} /> : null}

      <View style={{ marginTop: spacing.xl3, gap: spacing.xl }}>
        {grouped.map((entry) => {
          const exercise = lookup.get(entry.exerciseId);
          return (
            <Card key={entry.exerciseId} elevated style={{ paddingVertical: 0 }}>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl, paddingVertical: spacing.xl2, paddingHorizontal: spacing.xl3, borderBottomWidth: 1, borderBottomColor: borderColor }}
                onPress={() => navigation.navigate("ExerciseProgress", { id: entry.exerciseId })}
              >
                <View style={{ width: 3, height: 32, borderRadius: 2, backgroundColor: muscleAccentColor(exercise?.target ?? exercise?.body_part) ?? accent }} />
                <Text style={{ flex: 1, color: textColor, fontSize: 13, fontWeight: "700" }}>{nameForExercise(entry.exerciseId, lookup) ?? entry.exerciseId}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppIcon name="trending-up" size={13} color={faintColor} />
                  <AppIcon name="chevron-right" size={13} color={faintColor} />
                </View>
              </Pressable>
              <View style={{ paddingHorizontal: spacing.xl3, paddingVertical: spacing.xl2, gap: spacing.lg }}>
                {entry.records.map((record) => (
                  <View key={record.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 34, height: 34, borderRadius: radii.iconWrap, backgroundColor: "rgba(251,191,36,0.12)", alignItems: "center", justifyContent: "center" }}>
                        <AppIcon name="award" size={13} color={goldColor} />
                      </View>
                      <View>
                        <Text style={{ color: textColor, fontSize: 11, fontWeight: "700" }}>{record.record_type}</Text>
                        <Text style={{ color: mutedColor, fontSize: 10 }}>{formatShortDate(record.achieved_on)}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ color: goldColor, fontSize: 16, fontWeight: "900" }}>{recordValue(record)}</Text>
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
