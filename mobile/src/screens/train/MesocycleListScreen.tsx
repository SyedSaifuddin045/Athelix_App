import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, ProgressBar, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { useMesocycles } from "../../hooks";
import type { Mesocycle } from "../../api/types";

type Props = RootStackScreenProps<"MesocycleList">;

const STATUS_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "#00d4a8", bg: "rgba(0,212,168,0.15)", label: "Active" },
  planned: { color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", label: "Planned" },
  completed: { color: COLORS.muted, bg: "rgba(255,255,255,0.08)", label: "Completed" },
  cancelled: { color: COLORS.red, bg: "rgba(239,68,68,0.15)", label: "Cancelled" },
};

const DEFAULT_COLORS = ["#00d4a8", "#8b5cf6", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899"];

export function MesocycleListScreen({ navigation }: Props): React.JSX.Element {
  const { data: mesocyclesData, isLoading, error } = useMesocycles();

  const mesocycles: Mesocycle[] = mesocyclesData?.data || [];
  const total = mesocyclesData?.total || 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderMesocycle = ({ item, index }: { item: Mesocycle; index: number }) => {
    const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.planned;
    const progress = item.total_weeks > 0 ? (item.current_week / item.total_weeks) * 100 : 0;
    const color = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

    return (
      <Pressable onPress={() => (navigation as any).navigate("MesocycleDetail", { id: item.id })}>
        <Card style={[styles.mesoCard, { borderColor: `${color}30` }]}>
          <View style={styles.mesoHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Tag label={statusInfo.label} color={statusInfo.color} backgroundColor={statusInfo.bg} />
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
          </View>

          <Text style={styles.mesoName}>{item.name}</Text>
          {item.description && <Text style={styles.mesoPhase}>{item.description}</Text>}

          <View style={styles.mesoProgress}>
            <ProgressBar value={progress} color={color} height={6} />
            <View style={styles.mesoProgressLabels}>
              <Text style={styles.mesoProgressText}>
                Week {item.current_week} of {item.total_weeks}
              </Text>
              <Text style={styles.mesoDateRange}>
                {formatDate(item.start_date)} - {formatDate(item.end_date)}
              </Text>
            </View>
          </View>

          <View style={styles.mesoStats}>
            <View style={styles.mesoStat}>
              <Feather name="layers" size={14} color={COLORS.muted} />
              <Text style={styles.mesoStatValue}>{item.linked_sessions_count}</Text>
              <Text style={styles.mesoStatLabel}>Sessions</Text>
            </View>
            <View style={styles.mesoStat}>
              <Feather name="calendar" size={14} color={COLORS.muted} />
              <Text style={styles.mesoStatValue}>{item.total_weeks}</Text>
              <Text style={styles.mesoStatLabel}>Weeks</Text>
            </View>
            <View style={[styles.mesoStat, { borderRightWidth: 0 }]}>
              <Feather name="flag" size={14} color={color} />
              <Text style={[styles.mesoStatValue, { color }]}>{progress.toFixed(0)}%</Text>
              <Text style={styles.mesoStatLabel}>Complete</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader 
        title="Mesocycles" 
        subtitle="Advanced block planning" 
        onBack={() => navigation.goBack()} 
      />

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Feather name="info" size={16} color={COLORS.purple} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What is a Mesocycle?</Text>
            <Text style={styles.infoText}>
              A mesocycle is a structured training block (typically 4-8 weeks) designed to achieve specific fitness goals through progressive overload.
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.teal} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Failed to load mesocycles</Text>
          </View>
        ) : mesocycles.length > 0 ? (
          <>
            <SectionEyebrow color={COLORS.purple}>Your Cycles ({total})</SectionEyebrow>
            <FlatList
              data={mesocycles}
              keyExtractor={(item) => item.id}
              renderItem={renderMesocycle}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: 12 }}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No mesocycles yet</Text>
            <Text style={styles.emptySubtext}>Create your first training block</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.createButton}>
        <Feather name="plus" size={18} color={COLORS.purple} />
        <Text style={styles.createButtonText}>Create New Mesocycle</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: { marginTop: 16, borderColor: `${COLORS.purple}30`, backgroundColor: `${COLORS.purple}10` },
  infoRow: { flexDirection: "row", gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  infoText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  section: { marginTop: 24 },
  loader: { marginTop: 20 },
  mesoCard: { marginBottom: 12, borderWidth: 1 },
  mesoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  mesoName: { color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 12 },
  mesoPhase: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  mesoProgress: { marginTop: 16 },
  mesoProgressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  mesoProgressText: { color: COLORS.text, fontSize: 11, fontWeight: "600" },
  mesoDateRange: { color: COLORS.muted, fontSize: 11 },
  mesoStats: { flexDirection: "row", marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  mesoStat: { flex: 1, alignItems: "center", paddingVertical: 8, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.06)" },
  mesoStatValue: { color: COLORS.text, fontSize: 16, fontWeight: "900", marginTop: 6 },
  mesoStatLabel: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  emptySubtext: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  errorState: { alignItems: "center", paddingVertical: 40 },
  errorText: { color: COLORS.red, fontSize: 13 },
  createButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.purple}30`, borderStyle: "dashed" },
  createButtonText: { color: COLORS.purple, fontSize: 14, fontWeight: "700" },
});
