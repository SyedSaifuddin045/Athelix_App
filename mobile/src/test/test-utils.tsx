import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
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
