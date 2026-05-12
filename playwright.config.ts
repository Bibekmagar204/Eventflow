import { defineConfig, devices } from "@playwright/test"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.test" })
loadEnv({ path: ".env.local" })
loadEnv()

/** Match NEXTAUTH_URL host (often localhost) so session cookies apply after login. */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [["html", { open: "never" }], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  use: {
    baseURL,
    navigationTimeout: 60_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER ?? "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
})
