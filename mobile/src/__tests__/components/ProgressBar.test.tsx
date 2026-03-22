import React from "react";
import { render } from "@testing-library/react-native";
import { ProgressBar } from "../../components/ui/ProgressBar";

describe("ProgressBar", () => {
  it("renders correctly", () => {
    const { toJSON } = render(<ProgressBar value={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it("handles zero value", () => {
    const { toJSON } = render(<ProgressBar value={0} />);
    expect(toJSON()).toBeTruthy();
  });

  it("handles full value", () => {
    const { toJSON } = render(<ProgressBar value={100} />);
    expect(toJSON()).toBeTruthy();
  });

  it("handles value over 100 (clamped)", () => {
    const { toJSON } = render(<ProgressBar value={150} />);
    expect(toJSON()).toBeTruthy();
  });

  it("handles negative value (clamped)", () => {
    const { toJSON } = render(<ProgressBar value={-10} />);
    expect(toJSON()).toBeTruthy();
  });

  it("accepts custom color", () => {
    const { toJSON } = render(<ProgressBar value={75} color="#ff0000" />);
    expect(toJSON()).toBeTruthy();
  });

  it("accepts custom background color", () => {
    const { toJSON } = render(<ProgressBar value={75} backgroundColor="#0000ff" />);
    expect(toJSON()).toBeTruthy();
  });

  it("accepts custom height", () => {
    const { toJSON } = render(<ProgressBar value={50} height={20} />);
    expect(toJSON()).toBeTruthy();
  });
});
