import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const graphDir = path.resolve(__dirname, 'examples', '.claude', 'graph');
const baseURL = pathToFileURL(graphDir).href + '/';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
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
});
