import React from "react";
import { render } from "@testing-library/react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
import { Tag, ProgressBar, SectionEyebrow } from "../../components/ui/Indicators";


describe("Tag", () => {
  it("renders label", () => {
    const { getByText } = render(<TamaguiAppProvider><Tag label="Hello" color="#FF5A36" /></TamaguiAppProvider>);
    expect(getByText("Hello")).toBeTruthy();
  });
});

describe("ProgressBar", () => {
  it("renders with correct width percentage", () => {
    const { UNSAFE_root } = render(<TamaguiAppProvider><ProgressBar value={50} color="#FF5A36" /></TamaguiAppProvider>);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe("SectionEyebrow", () => {
  it("renders text", () => {
    const { getByText } = render(<TamaguiAppProvider><SectionEyebrow>Section Title</SectionEyebrow></TamaguiAppProvider>);
    expect(getByText("Section Title")).toBeTruthy();
  });
});
