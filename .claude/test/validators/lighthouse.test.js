import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert';

/**
 * Lighthouse CI Tests
 *
 * Note: These tests verify that the Lighthouse CLI is available and configured.
 * Full Lighthouse audits require a running server and are typically run as
 * part of CI/CD pipelines or via `npm run lighthouse`.
 */

function checkLighthouseCLI() {
  try {
    const output = execSync('npx lhci --version', { encoding: 'utf8', stdio: 'pipe' });
    return { available: true, version: output.trim() };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

function loadConfig() {
  const configPath = resolve(process.cwd(), 'lighthouserc.json');
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

describe('Lighthouse CI', () => {
  describe('setup', () => {
    it('has @lhci/cli installed', () => {
      const result = checkLighthouseCLI();
      assert.strictEqual(
        result.available,
        true,
        `Lighthouse CLI not available: ${result.error || 'unknown error'}`
      );
    });

    it('reports version information', () => {
      const result = checkLighthouseCLI();
      assert.ok(result.version, 'Should report a version number');
      assert.match(result.version, /\d+\.\d+\.\d+/, 'Version should be semver format');
    });

    it('has lighthouserc.json configuration file', () => {
      const configPath = resolve(process.cwd(), 'lighthouserc.json');

      assert.ok(
        existsSync(configPath),
        'lighthouserc.json configuration file should exist'
      );
    });

    it('has valid configuration structure', () => {
      const config = loadConfig();

      assert.ok(config.ci, 'Config should have ci property');
      assert.ok(config.ci.collect, 'Config should have collect settings');
      assert.ok(config.ci.assert, 'Config should have assert settings');
      assert.ok(config.ci.assert.assertions, 'Config should have assertions');
    });

    it('has required budget thresholds configured', () => {
      const config = loadConfig();
      const assertions = config.ci.assert.assertions;

      assert.ok(assertions['categories:performance'], 'Should have performance threshold');
      assert.strictEqual(
        assertions['categories:performance'][1].minScore,
        0.9,
        'Performance threshold should be 0.9 (90%)'
      );

      assert.ok(assertions['categories:accessibility'], 'Should have accessibility threshold');
      assert.strictEqual(
        assertions['categories:accessibility'][1].minScore,
        1.0,
        'Accessibility threshold should be 1.0 (100%)'
      );

      assert.ok(assertions['categories:best-practices'], 'Should have best-practices threshold');
      assert.strictEqual(
        assertions['categories:best-practices'][1].minScore,
        0.9,
        'Best practices threshold should be 0.9 (90%)'
      );

      assert.ok(assertions['categories:seo'], 'Should have SEO threshold');
      assert.strictEqual(
        assertions['categories:seo'][1].minScore,
        1.0,
        'SEO threshold should be 1.0 (100%)'
      );
    });
  });

  describe('npm script', () => {
    it('has lighthouse script in package.json', () => {
      const pkgPath = resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

      assert.ok(pkg.scripts.lighthouse, 'package.json should have lighthouse script');
      assert.match(
        pkg.scripts.lighthouse,
        /lhci/,
        'lighthouse script should invoke lhci'
      );
    });
  });
});
