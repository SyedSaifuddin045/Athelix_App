import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, BackHeader, SectionEyebrow } from "../../components";
import { RootStackScreenProps } from "../../types/navigation";
import { UNITS } from "../../data";

type Props = RootStackScreenProps<"Settings">;

export function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const [displayName, setDisplayName] = useState("Jordan");
  const [email, setEmail] = useState("jordan@example.com");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    prAlerts: true,
    weeklySummary: true,
    community: false,
  });

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
      <BackHeader title="Settings" onBack={() => navigation.goBack()} />

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.teal}>Account Details</SectionEyebrow>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.fieldInput}
              placeholderTextColor="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.fieldInput}
              keyboardType="email-address"
              placeholderTextColor="rgba(255,255,255,0.28)"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <Text style={styles.passwordValue}>••••••••••</Text>
              <Feather name="chevron-right" size={16} color={COLORS.teal} />
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.purple}>Units & Preferences</SectionEyebrow>
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Measurement System</Text>
          <View style={styles.unitOptions}>
            {UNITS.map((u) => (
              <Pressable
                key={u.value}
                onPress={() => setUnit(u.value as "metric" | "imperial")}
                style={[styles.unitOption, unit === u.value && styles.unitOptionActive]}
              >
                <Text style={[styles.unitText, unit === u.value && styles.unitTextActive]}>
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.blue}>Notifications</SectionEyebrow>
        <Card style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Workout Reminders</Text>
              <Text style={styles.toggleSub}>Daily reminders to train</Text>
            </View>
            <Switch
              value={notifications.workoutReminders}
              onValueChange={(v) => setNotifications({ ...notifications, workoutReminders: v })}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: `${COLORS.teal}40` }}
              thumbColor={notifications.workoutReminders ? COLORS.teal : "rgba(255,255,255,0.3)"}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>PR Alerts</Text>
              <Text style={styles.toggleSub}>Celebrate your achievements</Text>
            </View>
            <Switch
              value={notifications.prAlerts}
              onValueChange={(v) => setNotifications({ ...notifications, prAlerts: v })}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: `${COLORS.teal}40` }}
              thumbColor={notifications.prAlerts ? COLORS.teal : "rgba(255,255,255,0.3)"}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Weekly Summary</Text>
              <Text style={styles.toggleSub}>Progress recap every Sunday</Text>
            </View>
            <Switch
              value={notifications.weeklySummary}
              onValueChange={(v) => setNotifications({ ...notifications, weeklySummary: v })}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: `${COLORS.teal}40` }}
              thumbColor={notifications.weeklySummary ? COLORS.teal : "rgba(255,255,255,0.3)"}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Community</Text>
              <Text style={styles.toggleSub}>Tips and motivational content</Text>
            </View>
            <Switch
              value={notifications.community}
              onValueChange={(v) => setNotifications({ ...notifications, community: v })}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: `${COLORS.teal}40` }}
              thumbColor={notifications.community ? COLORS.teal : "rgba(255,255,255,0.3)"}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.green}>Security</SectionEyebrow>
        <Card style={styles.card}>
          <View style={styles.menuItemRow}>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemTitle}>Two-Factor Authentication</Text>
              <Text style={styles.menuItemSub}>Add an extra layer of security</Text>
            </View>
            <Tag label="Off" color={COLORS.orange} backgroundColor={`${COLORS.orange}20`} />
          </View>
          <View style={styles.divider} />
          <View style={styles.menuItemRow}>
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemTitle}>Biometric Login</Text>
              <Text style={styles.menuItemSub}>Use Face ID or fingerprint</Text>
            </View>
            <Tag label="On" color={COLORS.green} backgroundColor={`${COLORS.green}20`} />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.red}>Danger Zone</SectionEyebrow>
        <Card style={[styles.card, { borderColor: `${COLORS.red}30` }]}>
          <Pressable style={styles.dangerRow}>
            <View>
              <Text style={[styles.dangerTitle, { color: COLORS.red }]}>Delete Account</Text>
              <Text style={styles.dangerSub}>Permanently remove all data</Text>
            </View>
            <Feather name="trash-2" size={18} color={COLORS.red} />
          </Pressable>
        </Card>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.signOutButton}>
          <Feather name="log-out" size={16} color={COLORS.muted} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  card: { marginTop: 10 },
  fieldRow: { paddingVertical: 4 },
  fieldLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.4, textTransform: "uppercase" },
  fieldInput: { color: COLORS.text, fontSize: 15, paddingVertical: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  passwordValue: { color: COLORS.text, fontSize: 15 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },
  unitOptions: { flexDirection: "row", gap: 10, marginTop: 10 },
  unitOption: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center" },
  unitOptionActive: { backgroundColor: `${COLORS.teal}20`, borderColor: `${COLORS.teal}40` },
  unitText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  unitTextActive: { color: COLORS.teal },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleInfo: { flex: 1 },
  toggleTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  toggleSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  menuItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuItemInfo: { flex: 1 },
  menuItemTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  menuItemSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  dangerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dangerTitle: { fontSize: 14, fontWeight: "700" },
  dangerSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  footer: { marginTop: 32, alignItems: "center" },
  signOutButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16 },
  signOutText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
});
