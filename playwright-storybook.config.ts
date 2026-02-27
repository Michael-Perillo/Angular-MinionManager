import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Storybook viewport smoke tests.
 * Run: npx playwright test --config playwright-storybook.config.ts
 */
export default defineConfig({
  testDir: './e2e/specs',
  testMatch: 'storybook-viewport.spec.ts',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-storybook' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'storybook',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx http-server storybook-static --port 6006 --silent',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
