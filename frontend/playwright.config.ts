import { defineConfig } from '@playwright/test'

// Backend and frontend are started by hand, see docs/sprint.md Sprint 10.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // Every test shares one backend and its per-IP rate limits.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
    channel: 'chrome',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
})
