import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the built site in a real browser.
// Run `npm run build` first, then `npm run test:e2e`.
// To use a browser already on your computer instead of downloading one:
//   PW_CHANNEL=chrome npm run test:e2e
// E2E_PORT and DIST_DIR (read by serve-dist.mjs) let a second build be tested at the same time.
const port = Number(process.env.E2E_PORT || 4323);

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure', channel: process.env.PW_CHANNEL || undefined },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@phone/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, grep: /@phone/ },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
