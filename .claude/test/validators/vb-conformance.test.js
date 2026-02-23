/**
 * VB Conformance Checker Tests
 *
 * Tests the vb-conformance.js script against VB architectural principles.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '../..');
const fixturesDir = resolve(import.meta.dirname, '../fixtures');
const scriptPath = resolve(projectRoot, 'scripts/vb-conformance.js');

function runConformance(filePath) {
  try {
    const output = execSync(`node "${scriptPath}" "${filePath}"`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { passed: true, output, exitCode: 0 };
  } catch (error) {
    return {
      passed: false,
      output: (error.stdout || '') + (error.stderr || ''),
      exitCode: error.status,
    };
  }
}

describe('VB Conformance Checker', () => {

  describe('valid files', () => {
    it('passes a fully conformant VB page', () => {
      const result = runConformance(`${fixturesDir}/valid/vb-conformant.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });

    it('passes a minimal valid XHTML file', () => {
      const result = runConformance(`${fixturesDir}/valid/minimal.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
    });
  });

  describe('div detection (vb/no-div)', () => {
    it('detects div elements', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-divs.html`);
      assert.ok(result.output.includes('vb/no-div'), 'Should report vb/no-div rule');
    });

    it('suggests semantic alternatives based on class name', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-divs.html`);
      assert.ok(
        result.output.includes('<header>') || result.output.includes('header'),
        'Should suggest <header> for div.header'
      );
    });
  });

  describe('inline style detection (vb/no-inline-style)', () => {
    it('detects inline style attributes', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-inline-styles.html`);
      assert.ok(result.output.includes('vb/no-inline-style'), 'Should report vb/no-inline-style rule');
    });

    it('exits with error code for inline styles', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-inline-styles.html`);
      assert.strictEqual(result.exitCode, 1, 'Should exit with code 1 for errors');
    });
  });

  describe('state class detection (vb/no-class-for-state)', () => {
    it('detects state-like classes', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-state-classes.html`);
      assert.ok(result.output.includes('vb/no-class-for-state'), 'Should report vb/no-class-for-state rule');
    });

    it('suggests data-* attribute alternative', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-state-classes.html`);
      assert.ok(result.output.includes('data-'), 'Should suggest data-* attribute');
    });
  });

  describe('heading hierarchy (vb/semantic-heading-hierarchy)', () => {
    it('detects skipped heading levels', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-heading-skip.html`);
      assert.ok(
        result.output.includes('vb/semantic-heading-hierarchy'),
        'Should report heading hierarchy violation'
      );
    });

    it('reports which levels were skipped', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-heading-skip.html`);
      assert.ok(
        result.output.includes('h1') && result.output.includes('h3'),
        'Should mention the skipped levels'
      );
    });
  });

  describe('inline SVG detection (vb/icon-wc-required)', () => {
    it('detects inline SVG elements', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-inline-svg.html`);
      assert.ok(result.output.includes('vb/icon-wc-required'), 'Should report vb/icon-wc-required rule');
    });

    it('suggests icon-wc component', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-inline-svg.html`);
      assert.ok(result.output.includes('icon-wc'), 'Should suggest <icon-wc>');
    });
  });

  describe('CI mode', () => {
    it('reports summary in CI mode', () => {
      const result = runConformance(`${fixturesDir}/valid/vb-conformant.html`);
      // Valid file should pass even in CI mode
      assert.strictEqual(result.passed, true);
    });
  });

  describe('output format', () => {
    it('outputs in linter-compatible format', () => {
      const result = runConformance(`${fixturesDir}/invalid/vb-conformance/has-divs.html`);
      // Should contain line:col severity message rule format
      assert.ok(result.output.includes('=== vb-conformance ==='), 'Should have vb-conformance header');
      assert.match(result.output, /\d+:\d+\s+(error|warning|info)/, 'Should have line:col severity format');
    });
  });
});
