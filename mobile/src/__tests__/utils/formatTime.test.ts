import { formatTime } from "../../utils/formatTime";

describe("formatTime", () => {
  it("formats 0 seconds correctly", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats seconds under a minute correctly", () => {
    expect(formatTime(45)).toBe("00:45");
  });

  it("formats exactly one minute correctly", () => {
    expect(formatTime(60)).toBe("01:00");
  });

  it("formats minutes and seconds correctly", () => {
    expect(formatTime(125)).toBe("02:05");
  });

  it("formats a typical workout duration correctly", () => {
    expect(formatTime(3600)).toBe("60:00");
  });

  it("formats large values correctly", () => {
    expect(formatTime(5400)).toBe("90:00");
  });
});
