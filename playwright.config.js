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
    // Tests run against a self-contained static server (scripts/test-server.mjs)
    // that serves site/dist/pages — the assembled site, which includes /cdn,
    // /src, and /docs demo pages. Run `npm run build` first to populate it.
    baseURL: 'http://127.0.0.1:8123',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/test-server.mjs',
    url: 'http://127.0.0.1:8123/',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
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
});
