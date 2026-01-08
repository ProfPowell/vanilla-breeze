import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');
const projectRoot = resolve(import.meta.dirname, '../..');

function runCspell(file) {
  try {
    execSync(`npx cspell "${file}" --config "${projectRoot}/.cspell.json"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: projectRoot
    });
    return { passed: true, output: '' };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('cspell', () => {
  describe('valid files', () => {
    it('passes file with known words', () => {
      const result = runCspell(`${fixturesDir}/valid/minimal.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes file with semantic HTML terms', () => {
      const result = runCspell(`${fixturesDir}/valid/full-semantic.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('invalid files', () => {
    it('fails on misspelled words', () => {
      const result = runCspell(`${fixturesDir}/invalid/cspell/misspelled.html`);
      assert.strictEqual(result.passed, false, 'Expected misspelled words to fail');
      assert.match(result.output, /unknown word/i, 'Should report unknown word');
    });
  });
});
