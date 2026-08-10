import { defineConfig } from "@playwright/test";
import { e2eEnvironment } from "./tests/helpers/e2e-environment.ts";

export default defineConfig({
  globalSetup: "./tests/helpers/start-e2e-services.ts",
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: e2eEnvironment.clientUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run server",
      url: `${e2eEnvironment.apiUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev",
      url: e2eEnvironment.clientUrl,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
