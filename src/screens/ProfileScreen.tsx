import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { COLORS } from "../theme/colors";
import { styles } from "../theme/styles";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { RoundButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { formatKg, formatShortDate } from "../utils/format";
import { displayName, initialsFor } from "../utils/display";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

export function ProfileScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false, signOut } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const user = overview.data?.user;
  const profile = overview.data?.profile;
  const name = displayName(user, profile);
  const menuSections = [
    {
      label: "My Data",
      items: [
        { label: "Edit Profile", icon: <Feather name="user" size={15} color={COLORS.teal} />, route: "ProfileSetup" as keyof RootStackParamList, color: COLORS.teal },
        {
          label: "Bodyweight History",
          icon: <MaterialCommunityIcons name="scale-bathroom" size={15} color={COLORS.green} />,
          route: "BodyweightHistory" as keyof RootStackParamList,
          color: COLORS.green,
          badge: overview.data?.latest_body_weight_log ? formatKg(overview.data.latest_body_weight_log.weight_kg) : undefined,
        },
        { label: "Personal Records", icon: <Feather name="award" size={15} color={COLORS.gold} />, route: "PersonalRecords" as keyof RootStackParamList, color: COLORS.gold },
        { label: "Exercise Progress", icon: <Feather name="trending-up" size={15} color={COLORS.teal} />, route: "ExerciseProgress" as keyof RootStackParamList, color: COLORS.teal },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Account Settings", icon: <Feather name="settings" size={15} color={COLORS.purple} />, route: "Settings" as keyof RootStackParamList, color: COLORS.purple }],
    },
  ];

  return (
    <Screen>
      <View style={styles.mainHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
        <RoundButton onPress={() => navigation.navigate("Settings")}>
          <Feather name="settings" size={16} color="rgba(255,255,255,0.65)" />
        </RoundButton>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.profileAvatarWrap}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarInitials}>{initialsFor(name)}</Text>
          </View>
          <Pressable style={styles.profileEditButton} onPress={() => navigation.navigate("ProfileSetup")}>
            <Feather name="edit-3" size={13} color={COLORS.teal} />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>{name}</Text>
        <Text style={styles.detailLabel}>@{user?.username ?? "athlete"}</Text>
        <View style={[styles.rowGapTiny, { marginTop: 8 }]}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.green }]} />
          <Text style={styles.listMeta}>
            {profile?.fitness_level ?? "Fitness level"} - {profile?.height_cm ? `${profile.height_cm}cm` : "height"} -{" "}
            {profile?.weight_kg ? formatKg(profile.weight_kg) : "weight"}
          </Text>
        </View>

        <Card style={{ width: "100%", marginTop: 18, paddingVertical: 0 }}>
          <View style={styles.profileStatsRow}>
            {[
              { label: "Sessions", value: overview.data?.stats.completed_sessions ?? 0 },
              { label: "Templates", value: overview.data?.stats.total_workout_templates ?? 0 },
              { label: "PRs", value: overview.data?.stats.personal_record_count ?? 0 },
            ].map((stat, index, array) => (
                <View key={stat.label} style={styles.profileStatCell}>
                  <Text style={[styles.profileStatValue, { color: COLORS.teal }]}>{stat.value}</Text>
                  <Text style={styles.profileStatLabel}>{stat.label}</Text>
                  {index < array.length - 1 ? <View style={styles.profileStatDivider} /> : null}
                </View>
              ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionCardTitle}>Achievements</Text>
          <Text style={styles.linkText}>See All</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginTop: 10 }}>
          {(overview.data?.recent_personal_records.length ? overview.data.recent_personal_records : []).map((record) => (
            <Card key={record.id} style={styles.achievementCard}>
              <Text style={{ fontSize: 24 }}>🏆</Text>
              <Text style={[styles.smallStrongText, { marginTop: 10 }]}>{record.record_type}</Text>
              <Text style={[styles.listMeta, { color: COLORS.teal, marginTop: 6 }]}>{formatShortDate(record.achieved_on)}</Text>
            </Card>
          ))}
          {overview.data?.recent_personal_records.length === 0 ? (
            <Card style={styles.achievementCard}>
              <Text style={styles.detailLabel}>No PRs yet</Text>
            </Card>
          ) : null}
        </ScrollView>
      </View>

      <View style={{ marginTop: 18, gap: 16 }}>
        {menuSections.map((section) => (
          <View key={section.label}>
            <SectionEyebrow>{section.label}</SectionEyebrow>
            <Card style={{ paddingVertical: 0, marginTop: 10 }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <Pressable
                    style={styles.settingsRow}
                    onPress={() => {
                      if ("id" in item && item.id) {
                        (navigation.navigate as any)(item.route, { id: item.id });
                      } else {
                        (navigation.navigate as any)(item.route);
                      }
                    }}
                  >
                    <View style={[styles.softIconWrap, { backgroundColor: `${item.color}18` }]}>{item.icon}</View>
                    <Text style={[styles.listRowTitle, { flex: 1 }]}>{item.label}</Text>
                    {"badge" in item && item.badge ? <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>{item.badge}</Text> : null}
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                  {index < section.items.length - 1 ? <View style={styles.rowDivider} /> : null}
                </View>
              ))}
            </Card>
          </View>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await signOut();
          navigation.replace("Login");
        }}
        style={{ marginTop: 18 }}
      >
        <View style={styles.logoutButton}>
          <Feather name="log-out" size={15} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </View>
      </Pressable>

      <Text style={styles.footerText}>Athelix - member since {formatShortDate(user?.created_at)}</Text>
    </Screen>
  );
}
