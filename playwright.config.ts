import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests sequentially to avoid shared state issues */
  fullyParallel: false,
  workers: 1,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Maximum time one test can run for */
  timeout: 30 * 1000, // 30 seconds per test

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as [string]] : [])
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL - expects server to be running already */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'retain-on-failure',

    /* Maximum time for each action (click, fill, etc) */
    actionTimeout: 10 * 1000, // 10 seconds

    /* Maximum time for navigation */
    navigationTimeout: 15 * 1000, // 15 seconds
  },

  /* Configure projects for major browsers */
  projects: (() => {
    const slowProjects = [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
    ];

    const chromiumProject = [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ];

    return process.env.CI ? chromiumProject : [...chromiumProject, ...slowProjects];
  })(),

  /*
   * NOTE: This config expects the dev server to be running already.
   * Start it manually with: pnpm --filter ruach-next dev
   * Wait for "Ready" message before running tests.
   */
});
