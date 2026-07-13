import { defineConfig } from 'playwright/test';
import { join } from 'node:path';

/**
 * Playwright config for element-level visual tests.
 *
 * Separate from the root playwright.config.js to avoid mixing with
 * the 480-baseline theme surface tests. Desktop only for Phase 1.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'element-visual.spec.js',
  outputDir: './results',
  snapshotDir: './baselines',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFileName}/{arg}{ext}',
  timeout: 60000,
  workers: process.env.CI ? 4 : undefined,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:8123',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
  ],
  // Same static server as the root suite (serves site/dist/pages plus the
  // generated fixtures dir). Run `npm run build` first to populate it.
  webServer: {
    command: 'node scripts/test-server.mjs',
    cwd: join(import.meta.dirname, '../..'),
    port: 8123,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
