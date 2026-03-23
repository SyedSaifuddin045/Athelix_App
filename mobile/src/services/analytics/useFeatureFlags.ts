import { useState, useEffect } from "react";
import { getPostHogInstance } from "./analyticsService";

export function useFeatureFlag(flagKey: string): boolean | undefined {
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const instance = getPostHogInstance();
    if (!instance) {
      setIsEnabled(false);
      return;
    }

    const checkFlag = async () => {
      try {
        const enabled = await instance.isFeatureEnabled(flagKey);
        setIsEnabled(enabled);
      } catch {
        setIsEnabled(false);
      }
    };

    checkFlag();

    const interval = setInterval(checkFlag, 60000);

    return () => clearInterval(interval);
  }, [flagKey]);

  return isEnabled;
}

export function useFeatureFlagPayload<T>(flagKey: string, defaultValue: T): T | undefined {
  const [payload, setPayload] = useState<T | undefined>(undefined);

  useEffect(() => {
    const instance = getPostHogInstance();
    if (!instance) {
      setPayload(defaultValue);
      return;
    }

    const checkFlag = async () => {
      try {
        const value = await instance.getFeatureFlagPayload(flagKey);
        setPayload(value as T ?? defaultValue);
      } catch {
        setPayload(defaultValue);
      }
    };

    checkFlag();
  }, [flagKey, defaultValue]);

  return payload;
}