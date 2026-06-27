import { act } from "react";
import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TamaguiAppProvider } from "../tamagui/provider";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  queryClient?: QueryClient;
}

export function createWrapper(options?: WrapperOptions) {
  const qc = options?.queryClient ?? createTestQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <TamaguiAppProvider>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </TamaguiAppProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const qc = options?.queryClient ?? createTestQueryClient();
  const Wrapper = createWrapper({ queryClient: qc });

  return { ...render(ui, { wrapper: Wrapper, ...options }), qc };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockNavigation(): any {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    reset: jest.fn(),
    dispatch: jest.fn(),
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setParams: jest.fn(),
    setOptions: jest.fn(),
    preload: jest.fn(),
    navigateDeprecated: jest.fn(),
    getParent: jest.fn(() => undefined),
    getId: jest.fn(() => undefined),
    getState: jest.fn(() => ({})),
  };
}

export function runAllTimers() {
  act(() => { jest.runAllTimers(); });
}
