import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "athelix_access_token";
const REFRESH_TOKEN_KEY = "athelix_refresh_token";
const USER_KEY = "athelix_user";

const isWeb = Platform.OS === "web";

const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

class SecureStorage {
  async setAccessToken(token: string): Promise<void> {
    if (isWeb) {
      webStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (isWeb) {
      return webStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    if (isWeb) {
      webStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    if (isWeb) {
      return webStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  }

  async setUser(user: object): Promise<void> {
    const userStr = JSON.stringify(user);
    if (isWeb) {
      webStorage.setItem(USER_KEY, userStr);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(USER_KEY, userStr);
    }
  }

  async getUser<T>(): Promise<T | null> {
    let userStr: string | null = null;
    if (isWeb) {
      userStr = webStorage.getItem(USER_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      userStr = await SecureStore.getItemAsync(USER_KEY);
    }
    
    if (userStr) {
      try {
        return JSON.parse(userStr) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  async clearTokens(): Promise<void> {
    if (isWeb) {
      webStorage.removeItem(ACCESS_TOKEN_KEY);
      webStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }

  async clearAll(): Promise<void> {
    if (isWeb) {
      webStorage.removeItem(ACCESS_TOKEN_KEY);
      webStorage.removeItem(REFRESH_TOKEN_KEY);
      webStorage.removeItem(USER_KEY);
    } else {
      const SecureStore = await import("expo-secure-store");
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  }

  async hasTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }
}

export const secureStorage = new SecureStorage();
