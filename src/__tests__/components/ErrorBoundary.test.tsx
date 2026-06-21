import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "../../components/ui/ErrorBoundary";

const Boom = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("Test error");
  return <Text>All good</Text>;
};

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello</Text>
      </ErrorBoundary>
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("renders fallback on error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("Test error")).toBeTruthy();
    expect(getByText("Restart App")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(getByText("Custom fallback")).toBeTruthy();
    expect(queryByText("Something went wrong")).toBeNull();
  });

  it("restart button is pressable without crashing", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>
    );
    const restartBtn = getByText("Restart App");
    expect(() => fireEvent.press(restartBtn)).not.toThrow();
  });
});
