import { formatTime, formatCompactNumber, formatKg, formatVolume, formatDateLabel, formatShortDate, formatTimeLabel } from "../utils/format";

describe("formatTime", () => {
  it("formats seconds into MM:SS", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(3661)).toBe("61:01");
  });
});

describe("formatCompactNumber", () => {
  it("returns '0' for null/undefined", () => {
    expect(formatCompactNumber(null)).toBe("0");
    expect(formatCompactNumber(undefined)).toBe("0");
  });

  it("formats large numbers with k suffix", () => {
    expect(formatCompactNumber(1500)).toBe("1.5k");
    expect(formatCompactNumber(2500)).toBe("2.5k");
  });

  it("returns rounded number for small values", () => {
    expect(formatCompactNumber(42)).toBe("42");
    expect(formatCompactNumber(999)).toBe("999");
  });
});

describe("formatKg", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatKg(null)).toBe("-");
    expect(formatKg(undefined)).toBe("-");
  });

  it("formats with kg suffix by default", () => {
    expect(formatKg(100)).toBe("100 kg");
    expect(formatKg(67.5)).toBe("67.5 kg");
  });

  it("formats without suffix when empty string provided", () => {
    expect(formatKg(100, "")).toBe("100");
  });
});

describe("formatVolume", () => {
  it("returns '0 kg' for null", () => {
    expect(formatVolume(null)).toBe("0 kg");
  });

  it("formats volume", () => {
    expect(formatVolume(5000)).toBe("5k kg");
  });
});

describe("formatDateLabel", () => {
  it("returns '-' for null/empty", () => {
    expect(formatDateLabel(null)).toBe("-");
    expect(formatDateLabel("")).toBe("-");
  });
});

describe("formatShortDate", () => {
  it("returns '-' for null", () => {
    expect(formatShortDate(null)).toBe("-");
  });
});

describe("formatTimeLabel", () => {
  it("returns empty string for null", () => {
    expect(formatTimeLabel(null)).toBe("");
  });
});
