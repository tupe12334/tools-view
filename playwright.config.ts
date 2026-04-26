import { defineConfig, devices } from '@playwright/test';

const PORT = 8765;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node ../dist/index.js',
    cwd: 'examples',
    url: `${baseURL}/graph.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      TOOLSVIEW_NO_OPEN: '1',
    },
  },
});
