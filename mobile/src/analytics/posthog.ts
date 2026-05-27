import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import type { PostHogOptions, PostHogCustomStorage } from "posthog-react-native";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const POSTHOG_API_KEY =
  typeof process !== "undefined"
    ? process?.env?.EXPO_PUBLIC_POSTHOG_API_KEY ?? ""
    : "";

const POSTHOG_HOST =
  typeof process !== "undefined"
    ? process?.env?.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
    : "https://us.i.posthog.com";

const customStorage: PostHogCustomStorage =
  Platform.OS === "web"
    ? {
        getItem: async (key) => localStorage.getItem(key),
        setItem: async (key, value) => {
          localStorage.setItem(key, value);
        },
      }
    : {
        getItem: async (key) => {
          try {
            const file = new File(Paths.document, key);
            return await file.text();
          } catch {
            return null;
          }
        },
        setItem: async (key, value) => {
          const file = new File(Paths.document, key);
          file.write(value);
        },
      };

export function getPostHogConfig() {
  return {
    apiKey: POSTHOG_API_KEY,
    options: {
      host: POSTHOG_HOST,
      disabled: __DEV__ && process?.env?.EXPO_PUBLIC_POSTHOG_ENABLED !== "true",
      flushAt: 1,
      customStorage,
    } as Partial<PostHogOptions>,
  };
}
