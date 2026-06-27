import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
import { Card, LoadingCard, ErrorCard, EmptyCard } from "../../components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<TamaguiAppProvider><Card><Text>Content</Text></Card></TamaguiAppProvider>);
    expect(getByText("Content")).toBeTruthy();
  });
});

describe("LoadingCard", () => {
  it("renders loading text", () => {
    const { getByText } = render(<TamaguiAppProvider><LoadingCard label="Loading..." /></TamaguiAppProvider>);
    expect(getByText("Loading...")).toBeTruthy();
  });
});

describe("ErrorCard", () => {
  it("renders error message", () => {
    const { getByText } = render(<TamaguiAppProvider><ErrorCard error={new Error("Oops")} onRetry={jest.fn()} /></TamaguiAppProvider>);
    expect(getByText("Oops")).toBeTruthy();
  });

  it("renders error string", () => {
    const { getByText } = render(<TamaguiAppProvider><ErrorCard error="Something broke" onRetry={jest.fn()} /></TamaguiAppProvider>);
    expect(getByText("Something went wrong.")).toBeTruthy();
  });
});

describe("EmptyCard", () => {
  it("renders title and text", () => {
    const { getByText } = render(<TamaguiAppProvider><EmptyCard title="Nothing here" text="Add some data" /></TamaguiAppProvider>);
    expect(getByText("Nothing here")).toBeTruthy();
    expect(getByText("Add some data")).toBeTruthy();
  });
});
