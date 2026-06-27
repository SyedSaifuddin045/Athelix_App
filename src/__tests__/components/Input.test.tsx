import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
import { LabeledInput, MiniInput, ChipWrap, SelectableRow, Radio } from "../../components/ui/Input";


describe("LabeledInput", () => {
  it("renders label and value", () => {
    const { getByText, getByDisplayValue } = render(<TamaguiAppProvider><LabeledInput label="Name" value="John" onChangeText={jest.fn()} /></TamaguiAppProvider>);
    expect(getByText("Name")).toBeTruthy();
    expect(getByDisplayValue("John")).toBeTruthy();
  });
});

describe("MiniInput", () => {
  it("renders value", () => {
    const { getByDisplayValue } = render(<TamaguiAppProvider><MiniInput value="100" onChangeText={jest.fn()} /></TamaguiAppProvider>);
    expect(getByDisplayValue("100")).toBeTruthy();
  });
});

describe("ChipWrap", () => {
  it("renders chip items", () => {
    const { getByText } = render(<TamaguiAppProvider><ChipWrap items={[{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }]} selected="A" onSelect={jest.fn()} activeColor="#FF5A36" /></TamaguiAppProvider>);
    expect(getByText("A")).toBeTruthy();
    expect(getByText("B")).toBeTruthy();
  });
});

describe("SelectableRow", () => {
  it("renders label", () => {
    const { getByText } = render(<TamaguiAppProvider><SelectableRow selected={false} onPress={jest.fn()} label="Option" /></TamaguiAppProvider>);
    expect(getByText("Option")).toBeTruthy();
  });
});

describe("Radio", () => {
  it("renders selected state", () => {
    const { UNSAFE_root } = render(<TamaguiAppProvider><Radio selected={true} color="#FF5A36" /></TamaguiAppProvider>);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("renders unselected state", () => {
    const { UNSAFE_root } = render(<TamaguiAppProvider><Radio selected={false} color="#FF5A36" /></TamaguiAppProvider>);
    expect(UNSAFE_root).toBeTruthy();
  });
});
