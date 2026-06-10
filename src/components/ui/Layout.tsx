import { ScrollView, View } from "react-native";

import { styles } from "../../theme/styles";

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: object;
}) {
  if (!scroll) {
    return (
      <View style={styles.screen}>
        <View style={[styles.flexFill, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
