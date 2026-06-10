import { execSync } from "child_process";
import { device, element, by, expect } from "detox";

function clearKeychain() {
  const dir = `${process.env.HOME}/Library/Developer/CoreSimulator/Devices/${device.id}/data/Library/Keychains`;
  try {
    execSync(`rm -rf "${dir}"`);
  } catch {
    // First run — dir doesn't exist yet
  }
}

describe("Navigation", () => {
  beforeAll(async () => {
    clearKeychain();
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  async function login() {
    await element(by.id("email-input")).typeText("test@test.com");
    await element(by.id("password-input")).typeText("password123");
    await element(by.text("Sign In")).tap();
  }

  it("switches between bottom tabs", async () => {
    await login();
    await waitFor(element(by.text("Progress"))).toBeVisible().withTimeout(5000);
    await element(by.text("Progress")).tap();
    await expect(element(by.text("Analytics"))).toBeVisible();

    await element(by.text("History")).tap();
    await expect(element(by.text("Workout History"))).toBeVisible();

    await element(by.text("Settings")).tap();
    await expect(element(by.text("Settings"))).toBeVisible();
  });
});
