import { defineConfig } from "@playwright/test";

// Runs against a served copy of the whole site (e.g. `wrangler pages dev` on the repository root).
//   DEMO_BASE=http://127.0.0.1:8799/ npx playwright test
export default defineConfig({
  testDir: "e2e",
  timeout: 45000,
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: {
    baseURL: process.env.DEMO_BASE ?? "http://127.0.0.1:8799/",
    channel: process.env.PW_CHANNEL ?? "msedge",
    locale: "ar-IQ",
    reducedMotion: "reduce"
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } }
  ]
});
