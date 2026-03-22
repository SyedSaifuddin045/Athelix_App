import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Card } from "../../components/ui/Card";

describe("Card", () => {
  it("renders children correctly", () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText("Card Content")).toBeTruthy();
  });

  it("renders multiple children", () => {
    const { getByText } = render(
      <Card>
        <Text>First</Text>
        <Text>Second</Text>
      </Card>
    );
    expect(getByText("First")).toBeTruthy();
    expect(getByText("Second")).toBeTruthy();
  });
});
