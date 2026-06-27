import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { TamaguiAppProvider } from "../../tamagui/provider";
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
      <TamaguiAppProvider>
        <ErrorBoundary>
          <Text>Hello</Text>
        </ErrorBoundary>
      </TamaguiAppProvider>
    );
    expect(getByText("Hello")).toBeTruthy();
  });

  it("renders fallback on error", () => {
    const { getByText } = render(
      <TamaguiAppProvider>
        <ErrorBoundary>
          <Boom shouldThrow={true} />
        </ErrorBoundary>
      </TamaguiAppProvider>
    );
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("Test error")).toBeTruthy();
    expect(getByText("Restart App")).toBeTruthy();
  });

  it("renders custom fallback when provided", () => {
    const { getByText, queryByText } = render(
      <TamaguiAppProvider>
        <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
          <Boom shouldThrow={true} />
        </ErrorBoundary>
      </TamaguiAppProvider>
    );
    expect(getByText("Custom fallback")).toBeTruthy();
    expect(queryByText("Something went wrong")).toBeNull();
  });

  it("restart button is pressable without crashing", () => {
    const { getByText } = render(
      <TamaguiAppProvider>
        <ErrorBoundary>
          <Boom shouldThrow={true} />
        </ErrorBoundary>
      </TamaguiAppProvider>
    );
    const restartBtn = getByText("Restart App");
    expect(() => fireEvent.press(restartBtn)).not.toThrow();
  });
});
