import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');
const projectRoot = resolve(import.meta.dirname, '../..');

function runWebVitalsCheck(path) {
  try {
    const output = execSync(`node scripts/web-vitals-check.js "${path}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: projectRoot
    });
    return { passed: true, output };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('web-vitals-check', () => {
  describe('valid files', () => {
    it('passes files with complete web vitals instrumentation', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/valid/web-vitals/with-instrumentation.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
      assert.match(result.output, /Instrumented:.*1/, 'Should show 1 instrumented file');
      assert.match(result.output, /Missing:.*0/, 'Should show 0 missing files');
    });

    it('passes files with partial instrumentation but shows warnings', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/valid/web-vitals/partial-instrumentation.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
      assert.match(result.output, /Missing Core Web Vitals metrics:.*INP/, 'Should warn about missing INP');
    });
  });

  describe('invalid files', () => {
    it('fails files with JavaScript but no web vitals', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/invalid/web-vitals/no-instrumentation.html`);
      assert.strictEqual(result.passed, false, 'Expected files without web vitals to fail');
      assert.match(result.output, /Missing web-vitals library import/, 'Should report missing library import');
    });
  });

  describe('skipped files', () => {
    it('skips files without JavaScript', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/valid/minimal.html`);
      // Minimal files are skipped, so they pass (exit code 0) but are listed as skipped
      assert.strictEqual(result.passed, true, 'Expected minimal files to be skipped (pass)');
      assert.match(result.output, /Skipped:.*1/, 'Should show 1 skipped file');
    });
  });

  describe('help and snippet', () => {
    it('shows help with --help flag', () => {
      const result = runWebVitalsCheck('--help');
      assert.strictEqual(result.passed, true, 'Expected help to show successfully');
      assert.match(result.output, /Web Vitals Instrumentation Checker/, 'Should show script name');
      assert.match(result.output, /Usage:/, 'Should show usage instructions');
      assert.match(result.output, /LCP.*Largest Contentful Paint/, 'Should document LCP');
      assert.match(result.output, /INP.*Interaction to Next Paint/, 'Should document INP');
      assert.match(result.output, /CLS.*Cumulative Layout Shift/, 'Should document CLS');
    });

    it('shows instrumentation snippet with --snippet flag', () => {
      const result = runWebVitalsCheck('--snippet');
      assert.strictEqual(result.passed, true, 'Expected snippet to show successfully');
      assert.match(result.output, /Web Vitals Monitoring/, 'Should show snippet comment');
      assert.match(result.output, /import.*onLCP.*onINP.*onCLS/, 'Should import all three core metrics');
      assert.match(result.output, /onLCP\(sendToAnalytics\)/, 'Should call onLCP');
      assert.match(result.output, /onINP\(sendToAnalytics\)/, 'Should call onINP');
      assert.match(result.output, /onCLS\(sendToAnalytics\)/, 'Should call onCLS');
    });
  });

  describe('metric detection', () => {
    it('detects all three core metrics in complete instrumentation', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/valid/web-vitals/with-instrumentation.html`);
      assert.strictEqual(result.passed, true, 'Expected complete instrumentation to pass');
      assert.match(result.output, /Monitoring:.*LCP.*INP.*CLS/, 'Should detect all three metrics');
    });

    it('detects partial metrics and warns about missing ones', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/valid/web-vitals/partial-instrumentation.html`);
      assert.strictEqual(result.passed, true, 'Expected partial instrumentation to pass');
      assert.match(result.output, /Missing Core Web Vitals metrics:.*INP/, 'Should identify missing metric');
    });
  });

  describe('output formatting', () => {
    it('shows Core Web Vitals thresholds for failed files', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/invalid/web-vitals/no-instrumentation.html`);
      assert.strictEqual(result.passed, false, 'Expected to fail');
      assert.match(result.output, /LCP.*< 2\.5s/, 'Should show LCP threshold');
      assert.match(result.output, /INP.*< 200ms/, 'Should show INP threshold');
      assert.match(result.output, /CLS.*< 0\.1/, 'Should show CLS threshold');
    });

    it('shows instrumentation snippet for failed files', () => {
      const result = runWebVitalsCheck(`${fixturesDir}/invalid/web-vitals/no-instrumentation.html`);
      assert.strictEqual(result.passed, false, 'Expected to fail');
      assert.match(result.output, /Add Web Vitals Monitoring:/, 'Should show snippet header');
      assert.match(result.output, /import.*onLCP.*onINP.*onCLS/, 'Should show code snippet');
    });
  });
});
