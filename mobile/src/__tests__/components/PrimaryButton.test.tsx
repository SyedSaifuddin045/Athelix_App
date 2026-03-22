import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

describe("PrimaryButton", () => {
  it("renders with label", () => {
    const { getByText } = render(<PrimaryButton label="Click Me" onPress={() => {}} />);
    expect(getByText("Click Me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Press" onPress={mockOnPress} />);
    fireEvent.press(getByText("Press"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Disabled" onPress={mockOnPress} disabled />);
    fireEvent.press(getByText("Disabled"));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it("renders in subtle mode", () => {
    const { getByText } = render(<PrimaryButton label="Subtle" onPress={() => {}} subtle />);
    expect(getByText("Subtle")).toBeTruthy();
  });
});
