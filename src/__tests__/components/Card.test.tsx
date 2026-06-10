import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Card, LoadingCard, ErrorCard, EmptyCard } from "../../components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<Card><Text>Content</Text></Card>);
    expect(getByText("Content")).toBeTruthy();
  });
});

describe("LoadingCard", () => {
  it("renders loading text", () => {
    const { getByText } = render(<LoadingCard label="Loading..." />);
    expect(getByText("Loading...")).toBeTruthy();
  });
});

describe("ErrorCard", () => {
  it("renders error message", () => {
    const { getByText } = render(<ErrorCard error={new Error("Oops")} onRetry={jest.fn()} />);
    expect(getByText("Oops")).toBeTruthy();
  });

  it("renders error string", () => {
    const { getByText } = render(<ErrorCard error="Something broke" onRetry={jest.fn()} />);
    expect(getByText("Something went wrong.")).toBeTruthy();
  });
});

describe("EmptyCard", () => {
  it("renders title and text", () => {
    const { getByText } = render(<EmptyCard title="Nothing here" text="Add some data" />);
    expect(getByText("Nothing here")).toBeTruthy();
    expect(getByText("Add some data")).toBeTruthy();
  });
});
