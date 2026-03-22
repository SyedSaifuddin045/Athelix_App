import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ChipWrap } from "../../components/ui/ChipWrap";

describe("ChipWrap", () => {
  const items = ["Beginner", "Intermediate", "Advanced"];
  
  it("renders all items", () => {
    const { getByText } = render(
      <ChipWrap items={items} selected="Beginner" onSelect={() => {}} activeColor="#00d4a8" />
    );
    expect(getByText("Beginner")).toBeTruthy();
    expect(getByText("Intermediate")).toBeTruthy();
    expect(getByText("Advanced")).toBeTruthy();
  });

  it("calls onSelect when an item is pressed", () => {
    const mockOnSelect = jest.fn();
    const { getByText } = render(
      <ChipWrap items={items} selected="Beginner" onSelect={mockOnSelect} activeColor="#00d4a8" />
    );
    fireEvent.press(getByText("Advanced"));
    expect(mockOnSelect).toHaveBeenCalledWith("Advanced");
  });

  it("renders in multi-column mode", () => {
    const { getByText } = render(
      <ChipWrap items={items} selected="Beginner" onSelect={() => {}} activeColor="#00d4a8" columns={2} />
    );
    expect(getByText("Beginner")).toBeTruthy();
  });
});
