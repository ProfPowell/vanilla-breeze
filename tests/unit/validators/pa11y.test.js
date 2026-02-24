import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');

function runPa11y(file) {
  try {
    execSync(`npx pa11y "${file}"`, { encoding: 'utf8', stdio: 'pipe' });
    return { passed: true, output: '' };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('pa11y', () => {
  describe('valid files', () => {
    it('passes minimal accessible file', () => {
      const result = runPa11y(`${fixturesDir}/valid/minimal.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes full semantic accessible file', () => {
      const result = runPa11y(`${fixturesDir}/valid/full-semantic.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('invalid files', () => {
    it('fails on missing form labels', () => {
      const result = runPa11y(`${fixturesDir}/invalid/pa11y/missing-label.html`);
      assert.strictEqual(result.passed, false, 'Expected missing label to fail');
      assert.match(result.output, /label|input/i, 'Should report label/input error');
    });

    it('fails on empty link text', () => {
      const result = runPa11y(`${fixturesDir}/invalid/pa11y/empty-link.html`);
      assert.strictEqual(result.passed, false, 'Expected empty link to fail');
      assert.match(result.output, /link|anchor|img/i, 'Should report link/anchor error');
    });
  });
});
