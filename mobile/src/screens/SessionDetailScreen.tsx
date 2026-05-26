import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../auth/AuthProvider";
import { useSessionDetailQuery, useExercisesQuery } from "../api/queries";
import { updateWorkoutSessionWorkoutSessionsSessionIdPatch, deleteWorkoutSessionWorkoutSessionsSessionIdDelete } from "../api/endpoints/workout-sessions/workout-sessions";
import { getApiErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card, LoadingCard, ErrorCard } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { BackHeader, PrimaryButton, RoundButton } from "../components/ui/Button";
import { Tag } from "../components/ui/Indicators";
import { DetailStat } from "../components/ui/Stats";
import { ConfirmDialog } from "../components/ui/Modal";
import { exerciseLookup, groupSetsByExercise } from "../utils/mapping";
import { workoutTitle } from "../utils/display";
import { formatDateLabel, formatVolume, formatKg } from "../utils/format";
import { toNumberId } from "../utils/helpers";

export function SessionDetailScreen({ navigation, route }: { navigation: any; route?: { params?: { id?: string } } }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const sessionId = toNumberId(route?.params?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const detail = useSessionDetailQuery(sessionId, auth.isAuthenticated);
  const lookupQuery = useExercisesQuery({ limit: 200, offset: 0 }, auth.isAuthenticated);
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
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <LoadingCard label="Loading session..." />
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen glowColor="rgba(0,180,140,0.12)">
        <BackHeader title="Session Detail" onBack={() => navigation.goBack()} />
        <ErrorCard error={detail.error} onRetry={() => detail.refetch()} />
      </Screen>
    );
  }

  const session = detail.data;

  return (
    <Screen glowColor="rgba(0,180,140,0.12)">
      <BackHeader
        title="Session Detail"
        onBack={() => navigation.goBack()}
        right={
          <RoundButton onPress={() => setShowMenu((value) => !value)}>
            <Feather name="more-horizontal" size={16} color="rgba(255,255,255,0.7)" />
          </RoundButton>
        }
      />

      <View style={{ marginTop: 18 }}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap}>
            <Text style={{ fontSize: 30 }}>{session.mood ?? "✓"}</Text>
            <View>
              <Text style={styles.heroTitle}>{workoutTitle(session)}</Text>
              <Text style={styles.detailLabel}>{formatDateLabel(session.started_at)}</Text>
            </View>
          </View>
          {(session.prs_count ?? 0) > 0 ? <Tag label={`${session.prs_count} PR!`} color={COLORS.gold} /> : null}
        </View>
        <View style={[styles.threeUpGrid, { marginTop: 14 }]}>
          <DetailStat label="Duration" value={`${session.duration_minutes ?? 0}m`} icon={<Feather name="clock" size={13} color={COLORS.teal} />} />
          <DetailStat
            label="Sets"
            value={String(session.total_sets ?? session.sets.length)}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
          <DetailStat
            label="Volume"
            value={formatVolume(session.total_volume)}
            icon={<MaterialCommunityIcons name="dumbbell" size={13} color={COLORS.teal} />}
          />
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 18 }}>
        {exerciseGroups.map((exercise) => (
          <Card key={exercise.name} style={{ paddingHorizontal: 16, paddingVertical: 0 }}>
            <View style={styles.exerciseHeader}>
              <Text style={{ fontSize: 20 }}>{exercise.emoji}</Text>
              <Text style={[styles.listRowTitle, { flex: 1 }]}>{exercise.name}</Text>
              {exercise.sets.some((set) => set.is_pr) ? <Tag label="PR" color={COLORS.gold} /> : null}
            </View>
            <View style={{ paddingVertical: 14 }}>
              <View style={styles.sessionGridHeader}>
                {["Set", "kg", "Reps", "RPE"].map((label) => (
                  <Text key={label} style={styles.gridHeaderText}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={styles.sessionGridRow}>
                    <Text style={[styles.smallStrongText, { width: 28, textAlign: "center", color: set.set_type === "warmup" ? COLORS.orange : COLORS.muted }]}>
                      {set.set_type === "warmup" ? "W" : set.set_number}
                    </Text>
                    {[formatKg(set.weight_kg, ""), set.reps ?? "-", set.rpe ?? "-"].map((value, index) => (
                      <View key={`${set.id}-${index}`} style={styles.sessionCell}>
                        <Text style={styles.sessionCellText}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: 24, marginBottom: 32 }}>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} icon={<Feather name="check" size={18} color="#000000" />} />
      </View>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalScrim}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEdit(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Session</Text>
            <View style={{ marginTop: 16, gap: 14 }}>
              <View>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={styles.textArea}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Workout name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Mood (emoji)</Text>
                <TextInput
                  style={styles.input}
                  value={editMood}
                  onChangeText={setEditMood}
                  placeholder="e.g. 😊"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.textArea}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Add notes..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                />
              </View>
            </View>
            <PrimaryButton label="Save Changes" onPress={() => void saveEdit()} icon={<Feather name="check" size={16} color="#000000" />} style={{ marginTop: 18 }} />
            <PrimaryButton label="Cancel" onPress={() => setShowEdit(false)} subtle style={{ marginTop: 10 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.menuModalBackdrop} onPress={() => setShowMenu(false)}>
          <View style={styles.menuModalContent}>
            <Pressable style={styles.menuItem} onPress={handleEdit} hitSlop={12}>
              <Feather name="edit-3" size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.menuItemText}>Edit session</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete} hitSlop={12}>
              <Feather name="trash-2" size={14} color={COLORS.red} />
              <Text style={[styles.menuItemText, { color: COLORS.red }]}>Delete session</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Session"
        message="This will permanently delete this workout session and recalculate PRs."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Screen>
  );
}
