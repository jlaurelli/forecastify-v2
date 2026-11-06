import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Runs the agent against the real Claude API. Costs money: run by hand with `npm run eval`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["evals/**/*.eval.ts"],
    testTimeout: 120_000,
  },
});
