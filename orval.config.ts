import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:8050/openapi.json",
    output: {
      target: "./src/api/endpoints",
      schemas: "./src/api/model",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      clean: true,
      override: {
        mutator: {
          path: "./src/api/client.ts",
          name: "apiMutator",
        },
        query: {
          version: 5,
          useQuery: true,
          useMutation: true,
          shouldExportQueryKey: true,
          shouldExportHttpClient: true,
        },
        fetch: {
          includeHttpResponseReturnType: true,
        },
      },
    },
  },
});
