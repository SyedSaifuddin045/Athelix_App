import * as SecureStore from "expo-secure-store";

import type { AuthResponse } from "./model";

const REFRESH_TOKEN_KEY = "athelix.refreshToken";
const ACCESS_EXPIRES_AT_KEY = "athelix.accessExpiresAt";
const REFRESH_EXPIRES_AT_KEY = "athelix.refreshExpiresAt";

let accessToken: string | null = null;
let accessExpiresAt: number | null = null;

async function secureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function getFallbackItem(key: string) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function setFallbackItem(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Ignore storage failures; auth will fall back to an unauthenticated state.
  }
}

function deleteFallbackItem(key: string) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore storage failures; auth will fall back to an unauthenticated state.
  }
}

async function getStoredItem(key: string) {
  if (await secureStoreAvailable()) return SecureStore.getItemAsync(key);
  return getFallbackItem(key);
}

async function setStoredItem(key: string, value: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  setFallbackItem(key, value);
}

async function deleteStoredItem(key: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  deleteFallbackItem(key);
}

export function getAccessToken() {
  return accessToken;
}

export function hasUsableAccessToken() {
  return !!accessToken && (!accessExpiresAt || accessExpiresAt > Date.now() + 15_000);
}

export async function getRefreshToken() {
  return getStoredItem(REFRESH_TOKEN_KEY);
}

export async function persistAuthTokens(auth: AuthResponse) {
  accessToken = auth.access_token;
  accessExpiresAt = Date.now() + auth.expires_in * 1000;
  await setStoredItem(REFRESH_TOKEN_KEY, auth.refresh_token);
  await setStoredItem(ACCESS_EXPIRES_AT_KEY, String(accessExpiresAt));
  await setStoredItem(REFRESH_EXPIRES_AT_KEY, String(Date.now() + auth.refresh_expires_in * 1000));
}

export async function restoreAccessExpiry() {
  const stored = await getStoredItem(ACCESS_EXPIRES_AT_KEY);
  accessExpiresAt = stored ? Number(stored) : null;
}

export async function clearAuthTokens() {
  accessToken = null;
  accessExpiresAt = null;
  await Promise.all([
    deleteStoredItem(REFRESH_TOKEN_KEY),
    deleteStoredItem(ACCESS_EXPIRES_AT_KEY),
    deleteStoredItem(REFRESH_EXPIRES_AT_KEY),
  ]);
}
