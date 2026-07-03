import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "@tamagui/core";
import { spacing } from "../design-system/tokens/spacing";
import { radii } from "../design-system/tokens/radii";
import { Screen } from "../components/ui/Layout";
import { PrimaryButton } from "../components/ui/Button";
import { AppIcon } from "../design-system/icons/AppIcon";
import type { IconName } from "../components/ui/Icon";

const ONBOARDING_KEY = "onboarding_complete";

type Slide = {
  icon: IconName;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    icon: "dumbbell",
    title: "Track Every Workout",
    subtitle: "Log sets, reps, and weights in real-time. Build your perfect training session.",
  },
  {
    icon: "bar-chart-2",
    title: "Visualize Your Progress",
    subtitle: "See your gains with charts, personal records, and muscle balance breakdowns.",
  },
  {
    icon: "star",
    title: "Build Lasting Habits",
    subtitle: "Create templates, plan mesocycles, and track your workout streaks.",
  },
  {
    icon: "zap",
    title: "Ready to Train?",
    subtitle: "Start logging your first workout and take your training to the next level.",
  },
];

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding"> };

export function OnboardingScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isSignedIn = false } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const accent = theme.accent?.get() ?? "#FF5A36";
  const textColor = theme.color?.get() ?? "#FFFFFF";
  const mutedColor = theme.colorMuted?.get() ?? "rgba(255,255,255,0.45)";
  const faintColor = theme.colorFaint?.get() ?? "rgba(255,255,255,0.25)";
  const { width } = Dimensions.get("window");

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      navigation.replace(isSignedIn ? "MainTabs" : "Login");
      return;
    }
    navigation.replace(isSignedIn ? "MainTabs" : "Login");
  }, [isSignedIn, navigation]);

  const skip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      navigation.replace(isSignedIn ? "MainTabs" : "Login");
      return;
    }
    navigation.replace(isSignedIn ? "MainTabs" : "Login");
  }, [isSignedIn, navigation]);

  const next = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index ?? 0);
  }, []);

  const isLast = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width, flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl5 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: radii.card,
          backgroundColor: `${accent}20`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.xl5,
        }}
      >
        <AppIcon name={item.icon} size={40} color={accent} />
      </View>
      <Text
        style={{
          color: textColor,
          fontSize: 28,
          fontWeight: "900",
          textAlign: "center",
          lineHeight: 34,
          marginBottom: spacing.lg,
        }}
      >
        {item.title}
      </Text>
      <Text
        style={{
          color: mutedColor,
          fontSize: 15,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 300,
        }}
      >
        {item.subtitle}
      </Text>
    </View>
  );

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1 }}>
        <View style={{ alignItems: "flex-end", paddingHorizontal: spacing.xl5, paddingTop: spacing.lg }}>
          <Pressable onPress={skip} hitSlop={12}>
            <Text style={{ color: faintColor, fontSize: 14, fontWeight: "600" }}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          bounces={false}
          keyExtractor={(_, i) => String(i)}
        />

        <View style={{ paddingHorizontal: spacing.xl5, paddingBottom: spacing.xl7, gap: spacing.xl4 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.sm }}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentIndex ? accent : faintColor,
                }}
              />
            ))}
          </View>

          {isLast ? (
            <PrimaryButton label="Get Started" onPress={completeOnboarding} icon={<AppIcon name="arrow-right" size={18} color="#000000" />} />
          ) : (
            <PrimaryButton label="Next" onPress={next} icon={<AppIcon name="arrow-right" size={18} color="#000000" />} />
          )}
        </View>
      </View>
    </Screen>
  );
}
