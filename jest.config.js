/** @type {import('jest').Config} */
const config = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|expo-constants|expo-modules-core|expo-secure-store|expo-updates|react-native-gesture-handler|react-native-safe-area-context|@tanstack/react-query|@expo/vector-icons|react-native-reanimated|react-native-worklets|react-native-svg|lucide-react-native|@tamagui)/)",
  ],
  moduleNameMapper: {
    "^@expo/vector-icons$": "<rootDir>/src/test/mocks/vector-icons.js",
  },
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
};

module.exports = config;
