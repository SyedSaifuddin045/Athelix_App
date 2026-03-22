import React from "react";
import { render } from "@testing-library/react-native";
import { CompactStatCard } from "../../components/ui/CompactStatCard";

describe("CompactStatCard", () => {
  it("renders label and value", () => {
    const { getByText } = render(<CompactStatCard label="Workouts" value="42" />);
    expect(getByText("Workouts")).toBeTruthy();
    expect(getByText("42")).toBeTruthy();
  });

  it("renders with custom value color", () => {
    const { getByText } = render(
      <CompactStatCard label="PRs" value="10" valueColor="#ff0000" />
    );
    expect(getByText("PRs")).toBeTruthy();
    expect(getByText("10")).toBeTruthy();
  });

  it("renders different stat values", () => {
    const { getByText, rerender } = render(
      <CompactStatCard label="Duration" value="45" />
    );
    expect(getByText("45")).toBeTruthy();

    rerender(<CompactStatCard label="Volume" value="10k" />);
    expect(getByText("10k")).toBeTruthy();
  });
});
