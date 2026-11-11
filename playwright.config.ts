import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the built site in a real browser.
// Run `npm run build` first, then `npm run test:e2e`.
// To use a browser already on your computer instead of downloading one:
//   PW_CHANNEL=chrome npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4323', trace: 'retain-on-failure', channel: process.env.PW_CHANNEL || undefined },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@phone/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, grep: /@phone/ },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs 4323',
    url: 'http://localhost:4323',
    reuseExistingServer: !process.env.CI,
  },
});
