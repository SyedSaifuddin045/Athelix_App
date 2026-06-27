import React from "react";
import { render } from "@testing-library/react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
import { StatPill, MetaInline, CompactStatCard, DetailStat, AnalyticsCard, MetricBlock } from "../../components/ui/Stats";


describe("StatPill", () => {
  it("renders label and value", () => {
    const { getByText } = render(<TamaguiAppProvider><StatPill icon="dumbbell" label="Sets" value="12" /></TamaguiAppProvider>);
    expect(getByText("Sets")).toBeTruthy();
    expect(getByText("12")).toBeTruthy();
  });
});

describe("MetaInline", () => {
  it("renders text", () => {
    const { getByText } = render(<TamaguiAppProvider><MetaInline icon="clock" label="60m" /></TamaguiAppProvider>);
    expect(getByText("60m")).toBeTruthy();
  });
});

describe("CompactStatCard", () => {
  it("renders label and value", () => {
    const { getByText } = render(<TamaguiAppProvider><CompactStatCard label="PRs" value="5" /></TamaguiAppProvider>);
    expect(getByText("PRs")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
  });
});

describe("DetailStat", () => {
  it("renders label and value", () => {
    const { getByText } = render(<TamaguiAppProvider><DetailStat label="Duration" value="60m" icon="clock" /></TamaguiAppProvider>);
    expect(getByText("Duration")).toBeTruthy();
    expect(getByText("60m")).toBeTruthy();
  });
});

describe("AnalyticsCard", () => {
  it("renders value and label", () => {
    const { getByText } = render(<TamaguiAppProvider><AnalyticsCard label="Sets" value="12" sub="total" color="#22C55E" /></TamaguiAppProvider>);
    expect(getByText("12")).toBeTruthy();
  });
});

describe("MetricBlock", () => {
  it("renders value and label", () => {
    const { getByText } = render(<TamaguiAppProvider><MetricBlock value="100" label="kg" /></TamaguiAppProvider>);
    expect(getByText("100")).toBeTruthy();
    expect(getByText("kg")).toBeTruthy();
  });
});
