import { getMuscleStatus } from "../../utils/getMuscleStatus";
import { COLORS } from "../../theme/colors";

describe("getMuscleStatus", () => {
  it("returns 'Low' when sets are far below target (ratio < 0.6)", () => {
    const result = getMuscleStatus(2, 10);
    expect(result.label).toBe("Low");
    expect(result.color).toBe("#ef4444");
  });

  it("returns 'Under' when sets are below target (0.6 <= ratio < 0.85)", () => {
    const result = getMuscleStatus(7, 10);
    expect(result.label).toBe("Under");
    expect(result.color).toBe(COLORS.orange);
  });

  it("returns 'On track' when sets are close to target (0.85 <= ratio < 1.1)", () => {
    const result = getMuscleStatus(9, 10);
    expect(result.label).toBe("On track");
    expect(result.color).toBe(COLORS.teal);
  });

  it("returns 'On track' at exactly 85% of target", () => {
    const result = getMuscleStatus(8.5, 10);
    expect(result.label).toBe("On track");
  });

  it("returns 'On track' at exactly 100% of target", () => {
    const result = getMuscleStatus(10, 10);
    expect(result.label).toBe("On track");
  });

  it("returns 'Over' when sets exceed target (ratio >= 1.1)", () => {
    const result = getMuscleStatus(12, 10);
    expect(result.label).toBe("Over");
    expect(result.color).toBe(COLORS.green);
  });

  it("returns 'Over' at exactly 110% of target", () => {
    const result = getMuscleStatus(11, 10);
    expect(result.label).toBe("Over");
  });

  it("handles zero target gracefully", () => {
    const result = getMuscleStatus(5, 0);
    expect(result.label).toBe("Over");
  });
});
