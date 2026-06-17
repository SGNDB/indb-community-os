import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const TEST_LOCALE = process.env.E2E_LOCALE || "ar";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: TEST_LOCALE === "ar" ? "ar-MR" : "fr-MR",
    viewport: { width: 375, height: 812 }, // Mobile-first test
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        ...devices["iPhone 13"],
        locale: "ar-MR",
      },
    },
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        locale: "fr-MR",
      },
    },
  ],
});
