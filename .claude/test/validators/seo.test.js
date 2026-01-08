import { describe, it } from 'node:test';
import { execSync } from 'node:child_process';
import assert from 'node:assert';
import { resolve } from 'node:path';

const fixturesDir = resolve(import.meta.dirname, '../fixtures');
const projectRoot = resolve(import.meta.dirname, '../..');

/**
 * Run SEO content analysis on a file or directory
 * @param {string} path - Path to analyze
 * @returns {{passed: boolean, output: string}} Result with pass status and output
 */
function runSeo(path) {
  try {
    const output = execSync(`node scripts/seo-content.js "${path}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: projectRoot,
    });
    return { passed: true, output };
  } catch (error) {
    return { passed: false, output: error.stdout || error.stderr || error.message };
  }
}

describe('seo-content', () => {
  describe('valid files', () => {
    it('passes well-structured SEO content', () => {
      const result = runSeo(`${fixturesDir}/valid/seo/good-seo.html`);
      assert.strictEqual(result.passed, true, `Expected to pass but got: ${result.output}`);
      assert.match(result.output, /1 passed/, 'Should show 1 file passed');
    });

    it('shows warnings for high keyword density', () => {
      const result = runSeo(`${fixturesDir}/valid/seo/good-seo.html`);
      assert.match(result.output, /density too high/, 'Should show keyword density warnings');
    });
  });

  describe('invalid files', () => {
    it('fails on missing alt attributes', () => {
      const result = runSeo(`${fixturesDir}/invalid/seo/missing-alt.html`);
      assert.strictEqual(result.passed, false, 'Expected missing alt to fail');
      assert.match(result.output, /image.*missing alt attribute/i, 'Should report missing alt');
    });

    it('fails on multiple H1 headings', () => {
      const result = runSeo(`${fixturesDir}/invalid/seo/multiple-h1.html`);
      assert.strictEqual(result.passed, false, 'Expected multiple H1 to fail');
      assert.match(result.output, /Multiple H1 headings found/, 'Should report multiple H1');
    });

    it('reports detailed info for failed files', () => {
      const result = runSeo(`${fixturesDir}/invalid/seo/missing-alt.html`);
      assert.match(result.output, /Top keywords:/, 'Should show keyword analysis');
      assert.match(result.output, /Word count: \d+/, 'Should show word count');
      assert.match(result.output, /Headings: \d+/, 'Should show heading count');
      assert.match(result.output, /Internal links: \d+/, 'Should show internal links');
      assert.match(result.output, /Images: \d+/, 'Should show image count');
    });
  });

  describe('heading structure checks', () => {
    it('detects multiple H1 headings in failed output', () => {
      const result = runSeo(`${fixturesDir}/invalid/seo/multiple-h1.html`);
      assert.match(result.output, /H1: 2/, 'Should show H1 count of 2');
    });

    it('reports heading count for failed files', () => {
      const result = runSeo(`${fixturesDir}/invalid/seo/multiple-h1.html`);
      assert.match(result.output, /Headings: \d+/, 'Should show heading count');
    });
  });

  describe('thresholds', () => {
    it('shows SEO thresholds in output', () => {
      const result = runSeo(`${fixturesDir}/valid/seo/good-seo.html`);
      assert.match(result.output, /SEO Thresholds:/, 'Should show thresholds');
      assert.match(result.output, /Min words: \d+/, 'Should show min words threshold');
      assert.match(result.output, /Keyword density:/, 'Should show keyword density threshold');
    });
  });
});
