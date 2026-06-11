import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useAuth } from "@clerk/expo";
import { useSessionDetailQuery, useExercisesQuery } from "../api/queries";
import { updateWorkoutSessionWorkoutSessionsSessionIdPatch, deleteWorkoutSessionWorkoutSessionsSessionIdDelete } from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, RoundButton, IconButton } from "../components/ui/Button";
import { Tag } from "../components/ui/Indicators";
import { DetailStat } from "../components/ui/Stats";
import { ConfirmDialog } from "../components/ui/Modal";
import { Icon, type IconName } from "../components/ui/Icon";
import { exerciseLookup, groupSetsByExercise } from "../utils/mapping";
import { workoutTitle } from "../utils/display";
import { formatDateLabel, formatVolume, formatKg } from "../utils/format";
import { toNumberId } from "../utils/helpers";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SessionDetail">;
  route: RouteProp<RootStackParamList, "SessionDetail">;
};

const MOOD_ICONS: Record<string, IconName> = {
  Tired: "sleep",
  Okay: "meh",
  Good: "smile",
  Strong: "zap",
  Beast: "flame",
};

export function SessionDetailScreen({ navigation, route }: Props) {
  const { isSignedIn: isAuthenticated = false } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = toNumberId(route?.params?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const detail = useSessionDetailQuery(sessionId, isAuthenticated);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, isAuthenticated);
  const lookup = useMemo(() => exerciseLookup(lookupQuery.data?.items), [lookupQuery.data?.items]);
  const exerciseGroups = useMemo(() => groupSetsByExercise(detail.data?.sets ?? [], lookup), [detail.data?.sets, lookup]);

  const confirmDelete = async () => {
    if (!sessionId) return;
    try {
      await deleteWorkoutSessionWorkoutSessionsSessionIdDelete(sessionId);
      queryClient.removeQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.overview });
      setShowDeleteConfirm(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (!detail.data) return;
    setEditName(detail.data.name ?? "");
    setEditMood(detail.data.mood ?? "");
    setEditNotes(detail.data.notes ?? "");
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!sessionId) return;
    try {
      await updateWorkoutSessionWorkoutSessionsSessionIdPatch(sessionId, {
        name: editName || null,
        mood: editMood || null,
        notes: editNotes || null,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionDetail(sessionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      setShowEdit(false);
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    }
  };

  if (detail.isPending || lookupQuery.isPending) {
    return (
      <Screen>
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading session..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const session = detail.data;
  const moodIcon = session.mood ? MOOD_ICONS[session.mood] : null;

  return (
    <Screen>
      <BackHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => setShowMenu((v) => !v)}>
            <View style={{ opacity: 0.7 }}><Icon name="more-horizontal" size={16} color={COLORS.text} /></View>
          </RoundButton>
        }
      />

      <View style={{ marginTop: SPACING.xl3 }}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            {moodIcon ? (
              <View style={{ width: 44, height: 44, borderRadius: RADIUS.iconWrap, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name={moodIcon} size={22} color={COLORS.teal} />
              </View>
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: RADIUS.iconWrap, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={22} color={COLORS.teal} />
              </View>
            )}
            <View>
              <Text style={styles.heroTitle}>{workoutTitle(session)}</Text>
              <Text style={styles.detailLabel}>{formatDateLabel(session.started_at)}</Text>
            </View>
          </View>
          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR!`} color={COLORS.gold} /> : null}
        </View>
        <View style={[{ flexDirection: "row", gap: SPACING.xl, marginTop: SPACING.xl2 }]}>
          <DetailStat icon="clock" value={`${session.duration_minutes ?? 0}m`} label="Duration" color={COLORS.teal} />
          <DetailStat icon="list-checks" value={String(session.total_sets ?? session.sets.length)} label="Sets" color={COLORS.teal} />
          <DetailStat icon="gauge" value={formatVolume(session.total_volume)} label="Volume" color={COLORS.teal} />
        </View>
      </View>

      <View style={{ gap: SPACING.xl, marginTop: SPACING.xl3 }}>
        {exerciseGroups.map((exercise) => (
          <Card key={exercise.name} elevated style={{ paddingHorizontal: SPACING.xl3, paddingVertical: 0 }}>
            <View style={[styles.exerciseHeader, { flexDirection: "row", alignItems: "center", gap: SPACING.xl, paddingVertical: SPACING.xl2, borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
              <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
              {exercise.sets.some((set) => set.is_pr) ? <Tag label="PR" color={COLORS.gold} /> : null}
            </View>
            <View style={{ paddingVertical: SPACING.xl2 }}>
              <View style={[styles.sessionGridHeader, { flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.lg }]}>
                {["Set", "kg", "Reps", "RPE"].map((label) => (
                  <Text key={label} style={[styles.gridHeaderText, { flex: 1, color: COLORS.faint, fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center" }]}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={{ gap: SPACING.md }}>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={[styles.sessionGridRow, { flexDirection: "row", alignItems: "center", gap: SPACING.md }]}>
                    <Text style={[styles.smallStrongText, { width: 28, textAlign: "center", color: set.set_type === "warmup" ? COLORS.orange : COLORS.muted }]}>
                      {set.set_type === "warmup" ? "W" : set.set_number}
                    </Text>
                    {[formatKg(set.weight_kg, ""), set.reps ?? "-", set.rpe ?? "-"].map((value, index) => (
                      <View key={`${set.id}-${index}`} style={[styles.sessionCell, { flex: 1, minHeight: 34, borderRadius: RADIUS.stepper, backgroundColor: COLORS.cardSoft, alignItems: "center", justifyContent: "center" }]}>
                        <Text style={[styles.sessionCellText, { color: COLORS.text, fontSize: 12, fontWeight: "700" }]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: SPACING.xl5, marginBottom: SPACING.xl7 }}>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} icon={<Icon name="check" size={18} color="#000000" />} />
      </View>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={[styles.modalScrim, { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowEdit(false)} />
          <View style={[styles.bottomSheet, { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.xl5, paddingTop: SPACING.xl2, paddingBottom: SPACING.xl6 }]}>
            <View style={{ width: 40, height: 4, borderRadius: 4, alignSelf: "center", backgroundColor: COLORS.faint, marginBottom: SPACING.xl3 }} />
            <Text style={styles.sheetTitle}>Edit Session</Text>
            <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl2 }}>
              <View>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Workout name"
                  placeholderTextColor={COLORS.faint}
                  multiline
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Mood</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
                  value={editMood}
                  onChangeText={setEditMood}
                  placeholder="Tired, Okay, Good, Strong, Beast"
                  placeholderTextColor={COLORS.faint}
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: COLORS.cardSoft, borderColor: COLORS.border, color: COLORS.text, borderRadius: RADIUS.input }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  placeholderTextColor={COLORS.faint}
                  multiline
                />
              </View>
            </View>
            <PrimaryButton label="Save Changes" onPress={() => void saveEdit()} icon={<Icon name="check" size={16} color="#000000" />} style={{ marginTop: SPACING.xl3 }} />
            <PrimaryButton label="Cancel" onPress={() => setShowEdit(false)} subtle style={{ marginTop: SPACING.lg }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={[styles.menuModalBackdrop, { flex: 1, justifyContent: "flex-start", alignItems: "flex-end", paddingTop: 60, paddingRight: SPACING.xl4 }]} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuModalContent, { width: 170, borderRadius: RADIUS.cardSmall, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.sm }]}>
            <Pressable style={[styles.menuItem, { flexDirection: "row", alignItems: "center", gap: SPACING.lg, paddingHorizontal: SPACING.xl2, paddingVertical: SPACING.xl }]} onPress={handleEdit} hitSlop={12}>
              <Icon name="pencil" size={14} color={COLORS.muted} />
              <Text style={styles.menuItemText}>Edit session</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, { flexDirection: "row", alignItems: "center", gap: SPACING.lg, paddingHorizontal: SPACING.xl2, paddingVertical: SPACING.xl }]} onPress={handleDelete} hitSlop={12}>
              <Icon name="trash-2" size={14} color={COLORS.red} />
              <Text style={[styles.menuItemText, { color: COLORS.red }]}>Delete session</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Session"
          message="This will permanently delete this workout session and recalculate PRs."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </Screen>
  );
}
