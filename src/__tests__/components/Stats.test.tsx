import React from "react";
import { render } from "@testing-library/react-native";

import { StatPill, MetaInline, CompactStatCard, DetailStat, AnalyticsCard, MetricBlock } from "../../components/ui/Stats";
import { COLORS } from "../../theme/colors";

describe("StatPill", () => {
  it("renders label and value", () => {
    const { getByText } = render(<StatPill icon="dumbbell" label="Sets" value="12" />);
    expect(getByText("Sets")).toBeTruthy();
    expect(getByText("12")).toBeTruthy();
  });
});

describe("MetaInline", () => {
  it("renders text", () => {
    const { getByText } = render(<MetaInline icon="clock" label="60m" />);
    expect(getByText("60m")).toBeTruthy();
  });
});

describe("CompactStatCard", () => {
  it("renders label and value", () => {
    const { getByText } = render(<CompactStatCard label="PRs" value="5" />);
    expect(getByText("PRs")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
  });
});

describe("DetailStat", () => {
  it("renders label and value", () => {
    const { getByText } = render(<DetailStat label="Duration" value="60m" icon="clock" />);
    expect(getByText("Duration")).toBeTruthy();
    expect(getByText("60m")).toBeTruthy();
  });
});

describe("AnalyticsCard", () => {
  it("renders value and label", () => {
    const { getByText } = render(<AnalyticsCard label="Sets" value="12" sub="total" color={COLORS.green} />);
    expect(getByText("12")).toBeTruthy();
  });
});

describe("MetricBlock", () => {
  it("renders value and label", () => {
    const { getByText } = render(<MetricBlock value="100" label="kg" />);
    expect(getByText("100")).toBeTruthy();
    expect(getByText("kg")).toBeTruthy();
  });
});
