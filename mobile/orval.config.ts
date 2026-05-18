export default {
  api: {
    input: "http://localhost:8000/openapi.json",

    output: {
      target: "./src/api/endpoints",
      schemas: "./src/api/model",
      client: "fetch",
      mode: "tags-split",
      clean: true,
      prettier: true,
    },
  },
};