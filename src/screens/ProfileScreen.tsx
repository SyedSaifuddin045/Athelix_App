import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useOverviewQuery } from "../api/queries";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SHADOWS } from "../theme/spacing";
import { styles } from "../theme/styles";
import { Card } from "../components/ui/Card";
import { Screen } from "../components/ui/Layout";
import { RoundButton, IconButton } from "../components/ui/Button";
import { SectionEyebrow } from "../components/ui/Indicators";
import { Icon, type IconName } from "../components/ui/Icon";
import { formatKg, formatShortDate } from "../utils/format";
import { displayName, initialsFor } from "../utils/display";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "MainTabs"> };

const MENU_ITEMS: { label: string; items: { label: string; icon: IconName; route: keyof RootStackParamList; color: string; badge?: string }[] }[] = [
  {
    label: "My Data",
    items: [
      { label: "Edit Profile", icon: "user", route: "ProfileSetup", color: COLORS.teal },
      { label: "Bodyweight History", icon: "weight", route: "BodyweightHistory", color: COLORS.green },
      { label: "Personal Records", icon: "award", route: "PersonalRecords", color: COLORS.gold },
      { label: "Exercise Progress", icon: "trending-up", route: "ExerciseProgress", color: COLORS.teal },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Account Settings", icon: "settings", route: "Settings", color: COLORS.purple },
    ],
  },
];

export function ProfileScreen({ navigation }: Props) {
  const { isSignedIn: isAuthenticated = false, signOut } = useAuth();
  const overview = useOverviewQuery(isAuthenticated);
  const user = overview.data?.user;
  const profile = overview.data?.profile;
  const name = displayName(user, profile);
  const latestWeight = overview.data?.latest_body_weight_log;

  return (
    <Screen>
      <View style={[styles.mainHeader, { paddingBottom: SPACING.md }]}>
        <Text style={styles.headerTitle}>Profile</Text>
        <IconButton icon="settings" onPress={() => navigation.navigate("Settings")} />
      </View>

      <View style={[styles.profileTop, { alignItems: "center", paddingTop: SPACING.md }]}>
        <View style={[styles.profileAvatarWrap, { position: "relative", marginBottom: SPACING.xl2 }]}>
          <View
            style={[
              styles.profileAvatar,
              SHADOWS.glow(COLORS.teal),
              {
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.teal,
              },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: "#000000", fontSize: 28, fontWeight: "800" }]}>
              {initialsFor(name)}
            </Text>
          </View>
          <Pressable
            style={[
              styles.profileEditButton,
              {
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.surface,
                borderWidth: 2,
                borderColor: COLORS.screen,
              },
            ]}
            onPress={() => navigation.navigate("ProfileSetup")}
          >
            <Icon name="pencil" size={13} color={COLORS.teal} />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>{name}</Text>
        <Text style={[styles.detailLabel, { color: COLORS.muted }]}>
          @{user?.username ?? "athlete"}
        </Text>
        <View style={[styles.rowGapTiny, { marginTop: SPACING.md }]}>
          <View style={[styles.statusDot, { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green }]} />
          <Text style={styles.listMeta}>
            {profile?.fitness_level ?? "Fitness level"}
            {profile?.height_cm ? ` - ${profile.height_cm}cm` : ""}
            {profile?.weight_kg ? ` - ${formatKg(profile.weight_kg)}` : ""}
          </Text>
        </View>

        <Card elevated style={{ width: "100%", marginTop: SPACING.xl3, paddingVertical: 0 }}>
          <View style={[styles.profileStatsRow, { flexDirection: "row", alignItems: "stretch" }]}>
            {([
              { label: "Sessions", value: overview.data?.stats.completed_sessions ?? 0 },
              { label: "Templates", value: overview.data?.stats.total_workout_templates ?? 0 },
              { label: "PRs", value: overview.data?.stats.personal_record_count ?? 0 },
            ] as const).map((stat, index, array) => (
              <View key={stat.label} style={[styles.profileStatCell, { flex: 1, alignItems: "center", paddingVertical: SPACING.xl3, position: "relative" }]}>
                <Text style={[styles.profileStatValue, { color: COLORS.teal, fontSize: 20, fontWeight: "900" }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.profileStatLabel, { color: COLORS.muted, fontSize: 10, marginTop: SPACING.sm }]}>
                  {stat.label}
                </Text>
                {index < array.length - 1 ? (
                  <View style={[styles.profileStatDivider, { position: "absolute", right: 0, top: SPACING.xl3, bottom: SPACING.xl3, width: 1, backgroundColor: COLORS.border }]} />
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: SPACING.xl3, gap: SPACING.xl3 }}>
        {MENU_ITEMS.map((section) => (
          <View key={section.label}>
            <SectionEyebrow>{section.label}</SectionEyebrow>
            <Card elevated style={{ paddingVertical: 0, marginTop: SPACING.lg }}>
              {section.items.map((item, index) => (
                <View key={item.label}>
                  <Pressable
                    style={[
                      styles.settingsRow,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.xl,
                        paddingHorizontal: SPACING.xl3,
                        paddingVertical: SPACING.xl2,
                      },
                    ]}
                    onPress={() => {
                      (navigation.navigate as any)(item.route);
                    }}
                  >
                    <View
                      style={[
                        styles.softIconWrap,
                        {
                          width: 34,
                          height: 34,
                          borderRadius: RADIUS.iconWrap,
                          backgroundColor: `${item.color}18`,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Icon name={item.icon} size={15} color={item.color} />
                    </View>
                    <Text style={[styles.listRowTitle, { flex: 1 }]}>{item.label}</Text>
                    {item.badge ? (
                      <Text style={[styles.smallStrongText, { color: COLORS.teal }]}>
                        {item.badge}
                      </Text>
                    ) : null}
                    <Icon name="chevron-right" size={14} color={COLORS.faint} />
                  </Pressable>
                  {index < section.items.length - 1 ? (
                    <View style={[styles.rowDivider, { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.xl3 }]} />
                  ) : null}
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
        style={{ marginTop: SPACING.xl3 }}
      >
        <View
          style={[
            styles.logoutButton,
            {
              minHeight: 52,
              borderRadius: RADIUS.input,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.22)",
              backgroundColor: COLORS.redDark,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: SPACING.md,
            },
          ]}
        >
          <Icon name="log-out" size={15} color={COLORS.red} />
          <Text style={[styles.logoutText, { color: COLORS.red }]}>Sign Out</Text>
        </View>
      </Pressable>

      <Text style={[styles.footerText, { color: COLORS.faint, fontSize: 10, textAlign: "center", marginTop: SPACING.xl4 }]}>
        Athelix - member since {formatShortDate(user?.created_at)}
      </Text>
    </Screen>
  );
}
