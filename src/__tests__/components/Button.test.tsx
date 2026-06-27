import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
import { PrimaryButton, RoundButton } from "../../components/ui/Button";

describe("PrimaryButton", () => {
  it("renders label", () => {
    const { getByText } = render(<TamaguiAppProvider><PrimaryButton label="Click Me" onPress={jest.fn()} /></TamaguiAppProvider>);
    expect(getByText("Click Me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<TamaguiAppProvider><PrimaryButton label="Click Me" onPress={onPress} /></TamaguiAppProvider>);
    fireEvent.press(getByText("Click Me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", () => {
    const onPress = jest.fn();
    const { getByText } = render(<TamaguiAppProvider><PrimaryButton label="Click Me" onPress={onPress} disabled /></TamaguiAppProvider>);
    fireEvent.press(getByText("Click Me"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("RoundButton", () => {
  it("renders children", () => {
    const { getByText } = render(<TamaguiAppProvider><RoundButton onPress={jest.fn()}><Text>X</Text></RoundButton></TamaguiAppProvider>);
    expect(getByText("X")).toBeTruthy();
  });
});
