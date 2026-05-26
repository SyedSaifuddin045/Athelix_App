import { shadow, getMuscleStatus, toNumberId } from "../utils/helpers";

describe("shadow", () => {
  it("returns shadow object with given color", () => {
    const result = shadow("#00ff00");
    expect(result.shadowColor).toBe("#00ff00");
    expect(result.shadowOpacity).toBe(0.28);
    expect(result.elevation).toBe(8);
  });
});

describe("getMuscleStatus", () => {
  it("returns 'Over' for ratio >= 1.1", () => {
    expect(getMuscleStatus(11, 10).label).toBe("Over");
  });

  it("returns 'On track' for ratio >= 0.85", () => {
    expect(getMuscleStatus(9, 10).label).toBe("On track");
  });

  it("returns 'Low' for ratio < 0.6", () => {
    expect(getMuscleStatus(5, 10).label).toBe("Low");
  });
});

describe("toNumberId", () => {
  it("parses numeric string", () => {
    expect(toNumberId("42")).toBe(42);
  });

  it("returns number as-is", () => {
    expect(toNumberId(42)).toBe(42);
  });

  it("returns null for invalid input", () => {
    expect(toNumberId(null)).toBeNull();
    expect(toNumberId("abc")).toBeNull();
    expect(toNumberId(undefined)).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(toNumberId(NaN)).toBeNull();
  });
});
