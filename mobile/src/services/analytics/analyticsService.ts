import PostHog from "posthog-react-native";
import { env } from "../../env";

let posthogInstance: PostHog | null = null;

export function getPostHogInstance(): PostHog | null {
  if (!env.isAnalyticsEnabled) {
    return null;
  }

  if (!posthogInstance) {
    posthogInstance = new PostHog(env.posthogApiKey, {
      host: env.posthogHost,
    });
  }

  return posthogInstance;
}

export function captureEvent(eventName: string, properties?: Record<string, unknown>): void {
  const instance = getPostHogInstance();
  if (instance) {
    instance.capture(eventName, properties as any);
  }
}

export function identifyUser(userId: string, userProperties?: Record<string, unknown>): void {
  const instance = getPostHogInstance();
  if (instance) {
    instance.identify(userId, userProperties as any);
  }
}

export function resetUser(): void {
  const instance = getPostHogInstance();
  if (instance) {
    instance.reset();
  }
}

export function setUserProperties(properties: Record<string, unknown>): void {
  const instance = getPostHogInstance();
  if (instance) {
    (instance as any).setPersonProperties?.(properties);
  }
}

export function screenView(screenName: string, properties?: Record<string, unknown>): void {
  captureEvent("$screen", {
    ...properties,
    screen_name: screenName,
  });
}

export function flush(): Promise<void> {
  return new Promise((resolve) => {
    const instance = getPostHogInstance();
    if (instance) {
      (instance as any).flush?.().then(resolve).catch(() => resolve());
    } else {
      resolve();
    }
  });
}