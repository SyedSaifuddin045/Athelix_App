import * as SecureStore from "expo-secure-store";

const secureStoreOpts: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const tokenCache = {
  async getToken(key: string): Promise<string | null | undefined> {
    return Promise.race([
      SecureStore.getItemAsync(key, secureStoreOpts),
      new Promise<null>((resolve) => setTimeout(resolve, 5000, null)),
    ]);
  },
  async saveToken(key: string, token: string): Promise<void> {
    await SecureStore.setItemAsync(key, token, secureStoreOpts);
  },
  async clearToken(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, secureStoreOpts);
  },
};
