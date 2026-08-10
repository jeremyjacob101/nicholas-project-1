import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
          sequence: { groupOrder: 0 },
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          fileParallelism: false,
          globalSetup: ["tests/helpers/start-integration-services.ts"],
          setupFiles: ["tests/helpers/configure-integration-environment.ts"],
          hookTimeout: 120_000,
          testTimeout: 30_000,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
