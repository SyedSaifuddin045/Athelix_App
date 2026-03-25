import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "auth.refresh_token";

async function secureGetItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    return;
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDeleteItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } finally {
    await AsyncStorage.removeItem(key);
  }
}

export const authStorage = {
  async getRefreshToken(): Promise<string | null> {
    return secureGetItem(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(refreshToken: string): Promise<void> {
    await secureSetItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearRefreshToken(): Promise<void> {
    await secureDeleteItem(REFRESH_TOKEN_KEY);
  },
};
