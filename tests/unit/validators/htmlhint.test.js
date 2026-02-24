import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');

function runHtmlHint(file) {
  try {
    execSync(`npx htmlhint "${file}"`, { encoding: 'utf8', stdio: 'pipe' });
    return { passed: true, output: '' };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('htmlhint', () => {
  describe('valid files', () => {
    it('passes minimal valid XHTML file', () => {
      const result = runHtmlHint(`${fixturesDir}/valid/minimal.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes full semantic HTML5 file', () => {
      const result = runHtmlHint(`${fixturesDir}/valid/full-semantic.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('invalid files', () => {
    it('fails on missing doctype', () => {
      const result = runHtmlHint(`${fixturesDir}/invalid/htmlhint/no-doctype.html`);
      assert.strictEqual(result.passed, false, 'Expected missing doctype to fail');
      assert.match(result.output, /doctype/i, 'Should report doctype error');
    });

    it('fails on inline styles', () => {
      const result = runHtmlHint(`${fixturesDir}/invalid/htmlhint/inline-style.html`);
      assert.strictEqual(result.passed, false, 'Expected inline style to fail');
      assert.match(result.output, /inline-style/i, 'Should report inline-style error');
    });

    it('fails on missing alt attribute', () => {
      const result = runHtmlHint(`${fixturesDir}/invalid/htmlhint/missing-alt.html`);
      assert.strictEqual(result.passed, false, 'Expected missing alt to fail');
      assert.match(result.output, /alt/i, 'Should report alt error');
    });
  });
});
