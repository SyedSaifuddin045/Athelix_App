import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import Constants from "expo-constants";
import type { PostHogOptions, PostHogCustomStorage } from "posthog-react-native";

const extra = (
  typeof Constants.expoConfig?.extra === "object" && Constants.expoConfig?.extra !== null
    ? Constants.expoConfig.extra
    : {}
) as Record<string, string | undefined>;

const POSTHOG_API_KEY = extra.posthogApiKey ?? "";
const POSTHOG_HOST = extra.posthogHost ?? "https://us.i.posthog.com";

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
      disabled: __DEV__ && extra.posthogEnabled !== "true",
      flushAt: 1,
      customStorage,
    } as Partial<PostHogOptions>,
  };
}
