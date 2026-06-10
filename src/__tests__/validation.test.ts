import { numberOrNull, rpeError, parseRestSeconds } from "../utils/validation";

describe("numberOrNull", () => {
  it("parses valid number string", () => {
    expect(numberOrNull("100")).toBe(100);
    expect(numberOrNull("0")).toBe(0);
  });

  it("returns null for empty string", () => {
    expect(numberOrNull("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(numberOrNull("abc")).toBeNull();
  });
});

describe("rpeError", () => {
  it("returns null for valid RPE", () => {
    expect(rpeError("7")).toBeNull();
    expect(rpeError("10")).toBeNull();
    expect(rpeError("1")).toBeNull();
  });

  it("returns null for empty RPE", () => {
    expect(rpeError("")).toBeNull();
  });

  it("returns error for out of range RPE", () => {
    expect(rpeError("0")).toBe("RPE must be between 1 and 10");
    expect(rpeError("11")).toBe("RPE must be between 1 and 10");
  });

  it("returns error for non-numeric RPE", () => {
    expect(rpeError("abc")).toBe("RPE must be a number");
  });
});

describe("parseRestSeconds", () => {
  it("parses MM:SS format", () => {
    expect(parseRestSeconds("1:30")).toBe(90);
    expect(parseRestSeconds("2:00")).toBe(120);
  });

  it("parses single number as minutes", () => {
    expect(parseRestSeconds("2")).toBe(120);
    expect(parseRestSeconds("60")).toBe(3600);
  });

  it("returns null for empty string", () => {
    expect(parseRestSeconds("")).toBeNull();
  });
});
