import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');
const projectRoot = resolve(import.meta.dirname, '../..');

function runReadability(path) {
  try {
    const output = execSync(`node scripts/readability-check.js "${path}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: projectRoot
    });
    return { passed: true, output };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('readability-check', () => {
  describe('valid files', () => {
    it('passes easy reading content (grade < 8)', () => {
      const result = runReadability(`${fixturesDir}/valid/readability/easy-reading.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
      assert.match(result.output, /grade 0\.\d\/8/, 'Should show grade within threshold');
    });

    it('passes technical content with technical threshold (grade < 12)', () => {
      const result = runReadability(`${fixturesDir}/valid/readability/technical-content.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
      assert.match(result.output, /grade \d+\.\d\/12/, 'Should show grade within technical threshold');
    });
  });

  describe('invalid files', () => {
    it('fails on overly complex content', () => {
      const result = runReadability(`${fixturesDir}/invalid/readability/complex-content.html`);
      assert.strictEqual(result.passed, false, 'Expected complex content to fail');
      assert.match(result.output, /Exceeding Grade Level Threshold/, 'Should report threshold violation');
    });
  });

  describe('content detection', () => {
    it('detects technical content via data attribute (uses /12 threshold)', () => {
      const result = runReadability(`${fixturesDir}/valid/readability/technical-content.html`);
      // Technical content uses threshold of 12, general uses 8
      assert.match(result.output, /grade \d+\.\d\/12/, 'Should use technical threshold of 12');
    });

    it('defaults to general content type (uses /8 threshold)', () => {
      const result = runReadability(`${fixturesDir}/valid/readability/easy-reading.html`);
      // General content uses threshold of 8
      assert.match(result.output, /grade \d+\.\d\/8/, 'Should use general threshold of 8');
    });
  });
});
