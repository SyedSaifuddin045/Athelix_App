import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme/colors";
import { Screen, Card, Tag, SectionEyebrow } from "../../components";
import { TabScreenProps } from "../../types/navigation";
import { PROFILE_STATS, ACHIEVEMENTS } from "../../data";

type Props = TabScreenProps<"Profile">;

export function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const menuItems = [
    { icon: "user", title: "Account Details", sub: "Name, email, password", color: COLORS.teal },
    { icon: "bell", title: "Notifications", sub: "Workout reminders, PR alerts", color: COLORS.blue },
    { icon: "shield", title: "Security", sub: "Two-factor auth, biometrics", color: COLORS.green },
    { icon: "smartphone", title: "Units & Preferences", sub: "kg/lbs, cm/ft", color: COLORS.purple },
    { icon: "link", title: "Integrations", sub: "Apple Health, Google Fit", color: COLORS.orange },
    { icon: "help-circle", title: "Help & Support", sub: "FAQs, contact us", color: COLORS.muted },
  ];

  return (
    <Screen contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Jordan</Text>
            <Text style={styles.profileEmail}>jordan@example.com</Text>
            <Tag label="Intermediate" color={COLORS.purple} backgroundColor={`${COLORS.purple}20`} />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {PROFILE_STATS.map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.gold}>Achievements</SectionEyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
          {ACHIEVEMENTS.map((achievement, index) => (
            <Card key={index} style={styles.achievementCard}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementLabel}>{achievement.label}</Text>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </Card>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionEyebrow>Settings</SectionEyebrow>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => {
              if (item.title === "Account Details") navigation.navigate("Settings");
            }}
          >
            <Card style={styles.menuCard}>
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <Feather name={item.icon as any} size={16} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.28)" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <SectionEyebrow color={COLORS.red}>Danger Zone</SectionEyebrow>
        <Card style={styles.dangerCard}>
          <View style={styles.dangerRow}>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerTitle}>Export Data</Text>
              <Text style={styles.dangerSub}>Download all your workout data</Text>
            </View>
            <Feather name="download" size={16} color={COLORS.muted} />
          </View>
        </Card>
        <Card style={[styles.dangerCard, { borderColor: `${COLORS.red}30` }]}>
          <View style={styles.dangerRow}>
            <View style={styles.dangerInfo}>
              <Text style={[styles.dangerTitle, { color: COLORS.red }]}>Delete Account</Text>
              <Text style={styles.dangerSub}>Permanently remove all data</Text>
            </View>
            <Feather name="trash-2" size={16} color={COLORS.red} />
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>FitTrack v2.1.0</Text>
        <Text style={styles.footerText}>Made with dedication</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  avatarSection: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.teal, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#000000", fontSize: 28, fontWeight: "900" },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { color: COLORS.text, fontSize: 22, fontWeight: "900" },
  profileEmail: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  section: { marginTop: 28 },
  achievementsScroll: { marginTop: 10 },
  achievementCard: { width: 100, marginRight: 12, alignItems: "center", paddingVertical: 16 },
  achievementIcon: { fontSize: 32 },
  achievementLabel: { color: COLORS.text, fontSize: 12, fontWeight: "800", marginTop: 8, textAlign: "center" },
  achievementDate: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  menuCard: { marginBottom: 8 },
  menuRow: { flexDirection: "row", alignItems: "center" },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuInfo: { flex: 1, marginLeft: 12 },
  menuTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  menuSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  dangerCard: { marginBottom: 8 },
  dangerRow: { flexDirection: "row", alignItems: "center" },
  dangerInfo: { flex: 1 },
  dangerTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  dangerSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  footer: { alignItems: "center", marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  versionText: { color: COLORS.muted, fontSize: 12 },
  footerText: { color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 4 },
});
