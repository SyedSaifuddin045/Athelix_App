/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  settings: {
    react: { version: "detect" },
  },
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "react-hooks/exhaustive-deps": "warn",
  },
  ignorePatterns: [
    "node_modules/",
    "build/",
    "dist/",
    ".expo/",
    "ios/",
    "android/",
    "coverage/",
    "src/api/endpoints/",
    "src/api/model/",
  ],
};

module.exports = config;
