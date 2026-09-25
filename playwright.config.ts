import { defineConfig, devices } from '@playwright/test';

/** Port the app is served on during E2E runs (env `E2E_PORT`, default 3000). */
const port = Number(process.env.E2E_PORT ?? 3000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`E2E_PORT must be a positive integer, got "${process.env.E2E_PORT}"`);
}
const baseURL = `http://localhost:${port}`;

/** Port of the mock Anthropic server during E2E runs (env `MOCK_AI_PORT`, default 4010). */
const mockAiPort = Number(process.env.MOCK_AI_PORT ?? 4010);
if (!Number.isInteger(mockAiPort) || mockAiPort <= 0) {
  throw new Error(`MOCK_AI_PORT must be a positive integer, got "${process.env.MOCK_AI_PORT}"`);
}
const mockAiBaseURL = `http://127.0.0.1:${mockAiPort}`;

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
      command: 'node e2e/mock-anthropic.mjs',
      port: mockAiPort,
      reuseExistingServer: false,
      env: { MOCK_AI_PORT: String(mockAiPort) },
    },
    {
      command: `npm run e2e:server -- -p ${port}`,
      url: `${baseURL}/en`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { ANTHROPIC_BASE_URL: mockAiBaseURL },
    },
  ],
});
