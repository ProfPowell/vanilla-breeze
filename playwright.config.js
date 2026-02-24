import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './tests/visual/results',
  snapshotDir: './tests/visual/baselines',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFileName}/{arg}{ext}',
  timeout: 60000,
  workers: process.env.CI ? 4 : undefined,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
