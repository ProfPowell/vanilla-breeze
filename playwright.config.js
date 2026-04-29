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
    // Tests run against the local Caddy at https://vb.test, which serves
    // /cdn/* from dist/, /src/* from the repo root, and everything else
    // from site/dist/pages/ (see /opt/homebrew/etc/Caddyfile). Build the
    // site (`npm run build`) and ensure Caddy is up before running.
    baseURL: 'https://vb.test',
    ignoreHTTPSErrors: true,
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
});
