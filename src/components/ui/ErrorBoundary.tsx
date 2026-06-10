import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { COLORS } from "../../theme/colors";
import { styles } from "../../theme/styles";

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
        <View style={[styles.screen, { justifyContent: "center", alignItems: "center", padding: 24 }]}>
          <Text style={[styles.cardTitle, { color: COLORS.red, marginBottom: 8 }]}>Something went wrong</Text>
          <Text style={[styles.detailLabel, { textAlign: "center", marginBottom: 24 }]}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable onPress={this.handleRetry} style={[styles.primaryButton, { paddingHorizontal: 32 }]}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
