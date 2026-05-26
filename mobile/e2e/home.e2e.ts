import { device, element, by, expect } from "detox";

describe("Home screen", () => {
  beforeAll(async () => {
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

  it("shows loading state while fetching data", async () => {
    await login();
    await expect(element(by.text("Loading your dashboard..."))).toBeVisible();
  });

  it("shows user greeting after data loads", async () => {
    await login();
    await waitFor(element(by.id("home-greeting")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("taps start workout button", async () => {
    await login();
    await waitFor(element(by.text("Start Workout")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.text("Start Workout")).tap();
  });

  it("navigates to profile screen", async () => {
    await login();
    await waitFor(element(by.id("home-identity")))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id("home-identity")).tap();
  });
});
