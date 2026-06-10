import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { PrimaryButton, RoundButton } from "../../components/ui/Button";

describe("PrimaryButton", () => {
  it("renders label", () => {
    const { getByText } = render(<PrimaryButton label="Click Me" onPress={jest.fn()} />);
    expect(getByText("Click Me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Click Me" onPress={onPress} />);
    fireEvent.press(getByText("Click Me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton label="Click Me" onPress={onPress} disabled />);
    fireEvent.press(getByText("Click Me"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("RoundButton", () => {
  it("renders children", () => {
    const { getByText } = render(<RoundButton onPress={jest.fn()}><Text>X</Text></RoundButton>);
    expect(getByText("X")).toBeTruthy();
  });
});
