import { defineConfig, devices } from '@playwright/test';

/** Port the app is served on during E2E runs (env `E2E_PORT`, default 3000). */
const port = Number(process.env.E2E_PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`E2E_PORT must be a positive integer, got "${process.env.E2E_PORT}"`);
}
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'en-US', timezoneId: 'America/New_York' },
    },
  ],
  webServer: [
    {
      command: `npm run e2e:server -- -p ${port}`,
      url: `${baseURL}/en`,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
