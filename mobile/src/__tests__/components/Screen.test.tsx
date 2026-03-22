import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Screen } from "../../components/layout/Screen";

describe("Screen", () => {
  it("renders children in scroll mode (default)", () => {
    const { getByText } = render(
      <Screen>
        <Text>Screen Content</Text>
      </Screen>
    );
    expect(getByText("Screen Content")).toBeTruthy();
  });

  it("renders children in non-scroll mode", () => {
    const { getByText } = render(
      <Screen scroll={false}>
        <Text>Fixed Content</Text>
      </Screen>
    );
    expect(getByText("Fixed Content")).toBeTruthy();
  });

  it("renders with custom glow color", () => {
    const { toJSON } = render(
      <Screen glowColor="rgba(255,0,0,0.2)">
        <Text>Custom Glow</Text>
      </Screen>
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with custom content container style", () => {
    const { toJSON } = render(
      <Screen contentContainerStyle={{ padding: 20 }}>
        <Text>Styled Content</Text>
      </Screen>
    );
    expect(toJSON()).toBeTruthy();
  });
});
