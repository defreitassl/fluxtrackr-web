import { defineConfig } from "orval";

export default defineConfig({
  fluxtrackr: {
    input: {
      // Fonte única do contrato. Não copie este arquivo para o frontend.
      target: "../fluxtrackr-api/openapi.yaml",
    },
    output: {
      client: "fetch",
      target: "./src/api/generated/client.ts",
      override: {
        mutator: {
          path: "./src/lib/http.ts",
          name: "apiFetch",
        },
      },
    },
  },
});
