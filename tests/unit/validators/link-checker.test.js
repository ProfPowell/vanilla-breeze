import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');

function runLinkChecker(dir) {
  try {
    const output = execSync(`npx link-checker "${dir}"`, { encoding: 'utf8', stdio: 'pipe' });
    // Check for "N errors" where N > 0
    const errorMatch = output.match(/(\d+)\s+errors?/);
    const hasErrors = errorMatch && parseInt(errorMatch[1], 10) > 0;
    return { passed: !hasErrors, output };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('link-checker', () => {
  describe('valid files', () => {
    it('passes directory with valid internal links', () => {
      const result = runLinkChecker(`${fixturesDir}/valid`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('invalid files', () => {
    it('fails on broken internal links', () => {
      const result = runLinkChecker(`${fixturesDir}/invalid/link-checker`);
      assert.strictEqual(result.passed, false, 'Expected broken links to fail');
    });
  });
});
