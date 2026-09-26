import { defineConfig, devices } from '@playwright/test';

/** Port of the running docker compose app (env `APP_PORT`, default 3000), as in scripts/docker/smoke.ts. */
const port = Number(process.env.APP_PORT?.trim() || 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`APP_PORT must be a positive integer, got "${process.env.APP_PORT}"`);
}

/**
 * Regression journey against the app already running in docker compose (REQ-160): this config
 * starts no server of its own, so start the stack first. Separate from playwright.config.ts,
 * whose projects ignore e2e/container/.
 */
export default defineConfig({
  testDir: './e2e/container',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  outputDir: 'test-results/container',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'container',
      use: { ...devices['Desktop Chrome'], locale: 'en-US', timezoneId: 'America/New_York' },
    },
  ],
});
