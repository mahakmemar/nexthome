import { defineConfig, devices } from "@playwright/test";

// Checks that need the app in NORMAL mode (as deployed): simulate mode must be unreachable.
// Run after the simulate tests, on the same port 3000.
export default defineConfig({
  testDir: "./e2e-normal",
  testMatch: /.*\.spec\.ts/,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report-normal" }]] : "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "normal mode (Chrome)", use: { ...devices["Desktop Chrome"], channel: "chrome", headless: true } }],
  webServer: { command: "node e2e-normal/start-server.mjs", url: "http://localhost:3000/", reuseExistingServer: false, timeout: 240_000 },
});
