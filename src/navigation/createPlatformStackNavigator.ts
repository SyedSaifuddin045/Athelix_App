import type { ComponentType } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import type { ParamListBase } from "@react-navigation/native";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface StackNavigatorInstance<ParamList extends ParamListBase> {
  Navigator: ComponentType<any>;
  Screen: ComponentType<any>;
  Group: ComponentType<any>;
}

/**
 * Platform-aware stack navigator factory.
 *
 * Native (iOS/Android): `@react-navigation/native-stack` — native performance via react-native-screens.
 * Web:                   `@react-navigation/stack`        — JS-based fallback (react-native-screens has limited web support).
 */
export function createPlatformStackNavigator<ParamList extends ParamListBase>(): StackNavigatorInstance<ParamList> {
  if (Platform.OS === "web") {
    return createStackNavigator<ParamList>() as unknown as StackNavigatorInstance<ParamList>;
  }
  return createNativeStackNavigator<ParamList>() as unknown as StackNavigatorInstance<ParamList>;
}

/**
 * Map native-stack screen options to JS-stack equivalents on web.
 */
export function platformScreenOptions(
  opts: NativeStackNavigationOptions,
): Record<string, unknown> {
  if (Platform.OS !== "web") return opts;

  // native-stack → JS-stack key mapping
  const { animation, contentStyle, ...rest } = opts;
  return {
    ...rest,
    ...(contentStyle ? { cardStyle: contentStyle } : {}),
    gestureEnabled: true,
  };
}

// Re-export NativeStack types so screens keep using the same typed navigation prop
export type { NativeStackNavigationProp, NativeStackScreenProps };
