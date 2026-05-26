import { device, element, by, expect } from "detox";

describe("Navigation", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("switches between bottom tabs", async () => {
    await element(by.text("Progress")).tap();
    await expect(element(by.text("Analytics"))).toBeVisible();

    await element(by.text("History")).tap();
    await expect(element(by.text("Workout History"))).toBeVisible();

    await element(by.text("Settings")).tap();
    await expect(element(by.text("Settings"))).toBeVisible();
  });
});
