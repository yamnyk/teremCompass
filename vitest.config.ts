import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/types/**",
        "src/config.ts",
        "src/state.ts",
        "src/ui/icons.ts",
      ],
      reporter: ["text", "html"],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
