/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      build:
        "expo run:ios --configuration Debug",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/mobile.app",
    },
    "ios.release": {
      type: "ios.app",
      build:
        "expo run:ios --configuration Release",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/mobile.app",
    },
    "android.debug": {
      type: "android.apk",
      build: "expo run:android --variant Debug",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
    },
    "android.release": {
      type: "android.apk",
      build: "expo run:android --variant Release",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 17 Pro",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Pixel_9_Pro_API_36",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
