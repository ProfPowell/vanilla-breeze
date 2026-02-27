import { defineConfig } from 'playwright/test';

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
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
