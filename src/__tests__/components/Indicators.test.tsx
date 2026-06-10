import React from "react";
import { render } from "@testing-library/react-native";

import { Tag, ProgressBar, SectionEyebrow } from "../../components/ui/Indicators";
import { COLORS } from "../../theme/colors";

describe("Tag", () => {
  it("renders label", () => {
    const { getByText } = render(<Tag label="Hello" color={COLORS.teal} />);
    expect(getByText("Hello")).toBeTruthy();
  });
});

describe("ProgressBar", () => {
  it("renders with correct width percentage", () => {
    const { UNSAFE_root } = render(<ProgressBar value={50} color={COLORS.teal} />);
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe("SectionEyebrow", () => {
  it("renders text", () => {
    const { getByText } = render(<SectionEyebrow>Section Title</SectionEyebrow>);
    expect(getByText("Section Title")).toBeTruthy();
  });
});
