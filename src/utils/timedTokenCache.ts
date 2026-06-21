import * as SecureStore from "expo-secure-store";

const secureStoreOpts: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const tokenCache = {
  async getToken(key: string): Promise<string | null | undefined> {
    try {
      return await Promise.race([
        SecureStore.getItemAsync(key, secureStoreOpts),
        new Promise<null>((resolve) => setTimeout(resolve, 5000, null)),
      ]);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, token, secureStoreOpts);
    } catch {}
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key, secureStoreOpts);
    } catch {}
  },
};
