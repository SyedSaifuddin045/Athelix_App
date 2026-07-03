import { displayName, initialsFor, workoutTitle, nameForExercise } from "../utils/display";

describe("displayName", () => {
  it("returns profile display name over username", () => {
    const result = displayName({ id: 1, username: "jdoe" } as any, { display_name: "John Doe" } as any);
    expect(result).toBe("John Doe");
  });

  it("falls back to username", () => {
    const result = displayName({ id: 1, username: "jdoe" } as any, null);
    expect(result).toBe("jdoe");
  });

  it("returns default for missing data", () => {
    expect(displayName(null, null)).toBe("Athlete");
  });
});

describe("initialsFor", () => {
  it("returns initials from full name", () => {
    expect(initialsFor("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(initialsFor("John")).toBe("J");
  });

  it("returns default for empty name", () => {
    expect(initialsFor("")).toBe("AT");
  });
});

describe("workoutTitle", () => {
  it("returns session name if present", () => {
    expect(workoutTitle({ name: "Push Day" } as any)).toBe("Push Day");
  });

  it("returns default for completed workout", () => {
    expect(workoutTitle({ is_completed: true } as any)).toBe("Completed Workout");
  });

  it("returns default for null", () => {
    expect(workoutTitle(null)).toBe("Workout");
  });
});

describe("nameForExercise", () => {
  it("returns exercise name from lookup", () => {
    const lookup = new Map([["ex1", { id: "ex1", name: "Bench Press" } as any]]);
    expect(nameForExercise("ex1", lookup)).toBe("Bench Press");
  });

  it("humanizes slug-style id as fallback", () => {
    expect(nameForExercise("unknown", new Map())).toBe("Unknown");
  });

  it("returns Unknown label for numeric ids", () => {
    expect(nameForExercise("1307", new Map())).toBe("Unknown (#1307)");
  });
});
