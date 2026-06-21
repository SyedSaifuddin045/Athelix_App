import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import * as Updates from "expo-updates";

import { COLORS } from "../../theme/colors";
import { RADIUS, SHADOWS } from "../../theme/spacing";
import { Icon } from "./Icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={{ flex: 1, backgroundColor: COLORS.root, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: RADIUS.card,
              backgroundColor: COLORS.teal,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              ...SHADOWS.glow(COLORS.teal),
            }}
          >
            <Icon name="dumbbell" size={42} color="#000000" strokeWidth={2.5} />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "700", marginBottom: 8 }}>
            Athelix
          </Text>
          <Text style={{ color: COLORS.red, fontSize: 16, marginBottom: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: "center", marginBottom: 32, maxWidth: 280 }}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable
            onPress={() => Updates.reloadAsync()}
            style={{
              backgroundColor: COLORS.accent,
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>Restart App</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
