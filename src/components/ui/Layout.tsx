import { ScrollView, View } from "react-native";
import { useTheme } from "@tamagui/core";

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: object;
}) {
  const theme = useTheme();
  const screenBg = theme.background?.get() ?? "#050505";

  const content = !scroll ? (
    <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
  ) : (
    <ScrollView
      style={{ flex: 1, backgroundColor: screenBg }}
      contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: screenBg }}>
      {content}
    </View>
  );
}
