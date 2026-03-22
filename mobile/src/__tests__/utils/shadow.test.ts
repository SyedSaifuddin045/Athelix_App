import { shadow } from "../../utils/shadow";

describe("shadow", () => {
  it("creates a shadow object with the correct color", () => {
    const result = shadow("#ff0000");
    expect(result.shadowColor).toBe("#ff0000");
  });

  it("sets shadow opacity to 0.28", () => {
    const result = shadow(COLORS.teal);
    expect(result.shadowOpacity).toBe(0.28);
  });

  it("sets shadow radius to 16", () => {
    const result = shadow(COLORS.teal);
    expect(result.shadowRadius).toBe(16);
  });

  it("sets shadow offset with height of 8", () => {
    const result = shadow(COLORS.teal);
    expect(result.shadowOffset).toEqual({ width: 0, height: 8 });
  });

  it("sets elevation to 8", () => {
    const result = shadow(COLORS.teal);
    expect(result.elevation).toBe(8);
  });

  it("works with different color formats", () => {
    const hexResult = shadow("#00d4a8");
    const rgbaResult = shadow("rgba(0, 212, 168, 0.5)");
    const nameResult = shadow("purple");

    expect(hexResult.shadowColor).toBe("#00d4a8");
    expect(rgbaResult.shadowColor).toBe("rgba(0, 212, 168, 0.5)");
    expect(nameResult.shadowColor).toBe("purple");
  });
});

import { COLORS } from "../../theme/colors";
