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

describe("Auth flow", () => {
  beforeAll(async () => {
    clearKeychain();
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("shows login screen on launch", async () => {
    await expect(element(by.text("Welcome back"))).toBeVisible();
    await expect(element(by.text("Sign In"))).toBeVisible();
  });

  it("shows validation error on empty submit", async () => {
    await element(by.text("Sign In")).tap();
    await expect(element(by.text("Please fill in all fields."))).toBeVisible();
  });

  it("navigates to register screen", async () => {
    await element(by.text("Sign Up")).tap();
    await expect(element(by.text("Create Account"))).toBeVisible();
  });
});
