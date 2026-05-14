import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    benchmark: {
      include: ["tests/**/*.bench.ts"],
      reporters: ["verbose"],
      outputFile: "./bench/bench-results.json",
    },
    passWithNoTests: true,
  },
});
