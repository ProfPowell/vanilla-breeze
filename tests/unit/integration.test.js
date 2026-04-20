import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, 'fixtures');
const projectRoot = resolve(import.meta.dirname, '../..');

// pa11y shells out to puppeteer's Chromium (~/.cache/puppeteer/), which
// isn't installed in GitHub Actions. Full a11y coverage lives in the
// Playwright-based quality-report job; skip pa11y subtests in CI so
// quality-gate stays meaningful.
const skipPa11yInCI = process.env.CI === 'true'
  ? { skip: 'pa11y needs puppeteer Chromium; covered by quality-report via Playwright' }
  : {};

function runValidator(command, file, cwd = projectRoot) {
  try {
    execSync(command.replace('FILE', file), { encoding: 'utf8', stdio: 'pipe', cwd });
    return { passed: true, output: '' };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('integration', () => {
  describe('full pipeline on valid file', () => {
    const validFile = `${fixturesDir}/valid/minimal.html`;

    it('passes html-validate', () => {
      const result = runValidator(`npx html-validate "FILE"`, validFile);
      assert.strictEqual(result.passed, true, `html-validate failed: ${result.output}`);
    });

    it('passes htmlhint', () => {
      const result = runValidator(`npx htmlhint "FILE"`, validFile);
      assert.strictEqual(result.passed, true, `htmlhint failed: ${result.output}`);
    });

    it('passes pa11y', skipPa11yInCI, () => {
      const result = runValidator(`npx pa11y "FILE"`, validFile);
      assert.strictEqual(result.passed, true, `pa11y failed: ${result.output}`);
    });

    it('passes cspell', () => {
      const result = runValidator(`npx cspell "FILE" --config .claude/.cspell.json`, validFile);
      assert.strictEqual(result.passed, true, `cspell failed: ${result.output}`);
    });
  });

  describe('full pipeline on semantic file', () => {
    const semanticFile = `${fixturesDir}/valid/full-semantic.html`;

    it('all structure validators pass', () => {
      const htmlValidate = runValidator(`npx html-validate "FILE"`, semanticFile);
      const htmlhint = runValidator(`npx htmlhint "FILE"`, semanticFile);

      assert.strictEqual(htmlValidate.passed, true, `html-validate: ${htmlValidate.output}`);
      assert.strictEqual(htmlhint.passed, true, `htmlhint: ${htmlhint.output}`);
    });

    it('accessibility validator passes', skipPa11yInCI, () => {
      const result = runValidator(`npx pa11y "FILE"`, semanticFile);
      assert.strictEqual(result.passed, true, `pa11y failed: ${result.output}`);
    });
  });

  describe('validators catch expected errors', () => {
    it('html-validate catches XHTML violations', () => {
      const result = runValidator(
        `npx html-validate "FILE"`,
        `${fixturesDir}/invalid/html-validate/uppercase-tag.html`
      );
      assert.strictEqual(result.passed, false, 'Should catch uppercase tags');
    });

    it('htmlhint catches missing doctype', () => {
      const result = runValidator(
        `npx htmlhint "FILE"`,
        `${fixturesDir}/invalid/htmlhint/no-doctype.html`
      );
      assert.strictEqual(result.passed, false, 'Should catch missing doctype');
    });

    it('pa11y catches accessibility issues', skipPa11yInCI, () => {
      const result = runValidator(
        `npx pa11y "FILE"`,
        `${fixturesDir}/invalid/pa11y/missing-label.html`
      );
      assert.strictEqual(result.passed, false, 'Should catch missing labels');
    });
  });
});
