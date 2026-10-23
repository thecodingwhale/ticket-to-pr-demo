import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // Gates ratchet: +2 on each PR that lifts coverage (see CLAUDE.md).
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
  },
});
