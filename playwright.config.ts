import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * SubVault — Subscription Management System
 *
 * The frontend (Vite) runs on :5173 and the backend (Express) on :5001.
 * Vite already proxies /api → :5001, so tests only target the frontend URL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,           // Run tests sequentially — they share server state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                     // Single worker — sequential test execution
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,                // 60s per test (generous for slow machines)

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start Vite dev server before tests run */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
