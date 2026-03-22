import React from "react";
import { render } from "@testing-library/react-native";
import { Tag } from "../../components/ui/Tag";

describe("Tag", () => {
  it("renders the label correctly", () => {
    const { getByText } = render(<Tag label="Test Tag" />);
    expect(getByText("Test Tag")).toBeTruthy();
  });

  it("renders with default teal color", () => {
    const { getByText } = render(<Tag label="Default" />);
    const text = getByText("Default");
    expect(text).toBeTruthy();
  });

  it("renders with custom color", () => {
    const { getByText } = render(<Tag label="Custom" color="#ff0000" />);
    const text = getByText("Custom");
    expect(text).toBeTruthy();
  });

  it("renders with custom background color", () => {
    const { getByText } = render(<Tag label="Custom BG" backgroundColor="#0000ff" />);
    const text = getByText("Custom BG");
    expect(text).toBeTruthy();
  });
});
