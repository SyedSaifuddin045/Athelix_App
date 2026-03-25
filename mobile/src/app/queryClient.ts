import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "../lib/api/error";

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (error.statusCode !== undefined && error.statusCode < 500) {
      return false;
    }

    if (error.isNetworkError) {
      return failureCount < 2;
    }
  }

  return failureCount < 1;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isApiError(error)) {
          return error.isNetworkError && failureCount < 1;
        }

        return false;
      },
    },
  },
});
