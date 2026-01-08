import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');

function runHtmlValidate(file) {
  try {
    execSync(`npx html-validate "${file}"`, { encoding: 'utf8', stdio: 'pipe' });
    return { passed: true, output: '' };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('html-validate', () => {
  describe('valid files', () => {
    it('passes minimal valid XHTML file', () => {
      const result = runHtmlValidate(`${fixturesDir}/valid/minimal.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes full semantic HTML5 file', () => {
      const result = runHtmlValidate(`${fixturesDir}/valid/full-semantic.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes custom elements file', () => {
      const result = runHtmlValidate(`${fixturesDir}/valid/custom-elements.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('invalid files', () => {
    it('fails on uppercase tags', () => {
      const result = runHtmlValidate(`${fixturesDir}/invalid/html-validate/uppercase-tag.html`);
      assert.strictEqual(result.passed, false, 'Expected uppercase tags to fail');
      assert.match(result.output, /element-case/i, 'Should report element-case error');
    });

    it('fails on missing self-closing syntax', () => {
      const result = runHtmlValidate(`${fixturesDir}/invalid/html-validate/missing-self-close.html`);
      assert.strictEqual(result.passed, false, 'Expected missing self-close to fail');
      assert.match(result.output, /void-style/i, 'Should report void-style error');
    });

    it('fails on unquoted attributes', () => {
      const result = runHtmlValidate(`${fixturesDir}/invalid/html-validate/unquoted-attr.html`);
      assert.strictEqual(result.passed, false, 'Expected unquoted attributes to fail');
      assert.match(result.output, /attr-quotes/i, 'Should report attr-quotes error');
    });

    it('fails on multiple h1 tags', () => {
      const result = runHtmlValidate(`${fixturesDir}/invalid/html-validate/multiple-h1.html`);
      assert.strictEqual(result.passed, false, 'Expected multiple h1 to fail');
      assert.match(result.output, /heading-level/i, 'Should report heading-level error');
    });
  });
});
