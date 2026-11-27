import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the app in simulate mode (its own database, a clock the tests
// control), in real Google Chrome, headless. In CI they run against a production build, which
// is what gets deployed.
// The app always runs on port 3000, in either normal or simulate mode, never both at once.
// Locally, an app already running on 3000 is reused, but only if it is in simulate mode
// (e2e/global-setup.ts stops the run with a clear message if it is the normal app).
// The normal-mode checks live in playwright.normal.config.ts.
const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // One SQLite file and one simulated clock are shared, so tests run one at a time.
  // Each test loads its own scenario first, so they don't depend on each other.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // The app is built for phones first: every test runs on a phone-size screen.
    { name: "phone (Chrome)", use: { ...devices["Pixel 7"], channel: "chrome", headless: true } },
    // The key flows (tagged @desktop) also run on a desktop-size screen.
    { name: "desktop (Chrome)", grep: /@desktop/, use: { ...devices["Desktop Chrome"], channel: "chrome", headless: true } },
  ],
  webServer: {
    command: "node e2e/start-server.mjs",
    url: `http://localhost:${PORT}/api/sim/state`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
