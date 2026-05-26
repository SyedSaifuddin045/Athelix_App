import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { LabeledInput, MiniInput, ChipWrap, SelectableRow, Radio } from "../../components/ui/Input";
import { COLORS } from "../../theme/colors";

describe("LabeledInput", () => {
  it("renders label and value", () => {
    const { getByText, getByDisplayValue } = render(<LabeledInput label="Name" value="John" onChangeText={jest.fn()} />);
    expect(getByText("Name")).toBeTruthy();
    expect(getByDisplayValue("John")).toBeTruthy();
  });
});

describe("MiniInput", () => {
  it("renders value", () => {
    const { getByDisplayValue } = render(<MiniInput value="100" onChangeText={jest.fn()} />);
    expect(getByDisplayValue("100")).toBeTruthy();
  });
});

describe("ChipWrap", () => {
  it("renders chip items", () => {
    const { getByText } = render(<ChipWrap items={["A", "B", "C"]} selected="A" onSelect={jest.fn()} activeColor={COLORS.teal} />);
    expect(getByText("A")).toBeTruthy();
    expect(getByText("B")).toBeTruthy();
  });
});

describe("SelectableRow", () => {
  it("renders label", () => {
    const { getByText } = render(<SelectableRow selected={false} onPress={jest.fn()} label="Option" />);
    expect(getByText("Option")).toBeTruthy();
  });
});

describe("Radio", () => {
  it("renders selected state", () => {
    const { UNSAFE_root } = render(<Radio selected={true} color={COLORS.teal} />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("renders unselected state", () => {
    const { UNSAFE_root } = render(<Radio selected={false} color={COLORS.teal} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
