import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: process.env.OPERLY_BASE_URL || "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: process.platform === "win32" ? "chrome" : undefined,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: { mode: "retain-on-failure", screenshots: false, snapshots: true },
    screenshot: "off",
  },
  webServer: process.env.OPERLY_EXTERNAL_SERVER ? undefined : {
    command: "node node_modules/next/dist/bin/next start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
