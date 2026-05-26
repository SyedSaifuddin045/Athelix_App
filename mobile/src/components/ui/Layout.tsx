import { ScrollView, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

export function Glow({ color }: { color: string }) {
  return <View pointerEvents="none" style={[styles.glow, { backgroundColor: color }]} />;
}

export function Screen({
  children,
  glowColor = "rgba(0,180,140,0.18)",
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  glowColor?: string;
  scroll?: boolean;
  contentContainerStyle?: object;
}) {
  if (!scroll) {
    return (
      <View style={styles.screen}>
        <Glow color={glowColor} />
        <View style={[styles.flexFill, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Glow color={glowColor} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
