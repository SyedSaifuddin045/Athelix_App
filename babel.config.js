module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["expo/internal/babel-preset"],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          config: "./src/tamagui/config.ts",
          components: ["tamagui"],
        },
      ],
    ],
  };
};
