import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, ProgressBar, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { MESOCYCLE_LIST, MESOCYCLE_STATUS } from "../../data";

type Props = RootStackScreenProps<"MesocycleList">;

export function MesocycleListScreen({ navigation }: Props): React.JSX.Element {
  const renderMesocycle = ({ item }: { item: typeof MESOCYCLE_LIST[0] }) => {
    const statusInfo = MESOCYCLE_STATUS[item.status];
    const progress = item.weeks > 0 ? (item.currentWeek / item.weeks) * 100 : 0;

    return (
      <Pressable onPress={() => navigation.navigate("MesocycleDetail", { id: item.id })}>
        <Card style={[styles.mesoCard, { borderColor: `${item.color}30` }]}>
          <View style={styles.mesoHeader}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Tag label={statusInfo.label} color={statusInfo.color} backgroundColor={statusInfo.bg} />
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
          </View>

          <Text style={styles.mesoName}>{item.name}</Text>
          <Text style={styles.mesoPhase}>{item.phase}</Text>

          <View style={styles.mesoProgress}>
            <ProgressBar value={progress} color={item.color} height={6} />
            <View style={styles.mesoProgressLabels}>
              <Text style={styles.mesoProgressText}>Week {item.currentWeek} of {item.weeks}</Text>
              <Text style={styles.mesoDateRange}>{item.startDate} - {item.endDate}</Text>
            </View>
          </View>

          <View style={styles.mesoStats}>
            <View style={styles.mesoStat}>
              <Feather name="layers" size={14} color={COLORS.muted} />
              <Text style={styles.mesoStatValue}>{item.sessions}</Text>
              <Text style={styles.mesoStatLabel}>Sessions</Text>
            </View>
            <View style={styles.mesoStat}>
              <Feather name="calendar" size={14} color={COLORS.muted} />
              <Text style={styles.mesoStatValue}>{item.weeks}</Text>
              <Text style={styles.mesoStatLabel}>Weeks</Text>
            </View>
            <View style={[styles.mesoStat, { borderRightWidth: 0 }]}>
              <Feather name="flag" size={14} color={item.color} />
              <Text style={[styles.mesoStatValue, { color: item.color }]}>{progress.toFixed(0)}%</Text>
              <Text style={styles.mesoStatLabel}>Complete</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Mesocycles" subtitle="Advanced block planning" onBack={() => navigation.goBack()} />

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
        <SectionEyebrow color={COLORS.purple}>Your Cycles ({MESOCYCLE_LIST.length})</SectionEyebrow>
        <FlatList
          data={MESOCYCLE_LIST}
          keyExtractor={(item) => item.id}
          renderItem={renderMesocycle}
          scrollEnabled={false}
          contentContainerStyle={{ marginTop: 12 }}
        />
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
  createButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.purple}30`, borderStyle: "dashed" },
  createButtonText: { color: COLORS.purple, fontSize: 14, fontWeight: "700" },
});
