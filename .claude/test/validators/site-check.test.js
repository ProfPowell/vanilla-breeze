/**
 * Site Infrastructure Checker Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '../..');
const scriptPath = resolve(projectRoot, 'scripts/site-check.js');

/**
 * Run site-check.js and return results
 */
function runSiteCheck(args = '') {
  try {
    const output = execSync(`node ${scriptPath} ${args}`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output, exitCode: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status,
    };
  }
}

describe('Site Infrastructure Checker', () => {

  describe('Help and Options', () => {

    it('shows help with --help flag', () => {
      const result = runSiteCheck('--help');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('Site Infrastructure Checker'));
      assert.ok(result.output.includes('favicon.ico'));
      assert.ok(result.output.includes('robots.txt'));
      assert.ok(result.output.includes('llms.txt'));
      assert.ok(result.output.includes('security.txt'));
      assert.ok(result.output.includes('opensearch.xml'));
      assert.ok(result.output.includes('humans.txt'));
      assert.ok(result.output.includes('500.html'));
      assert.ok(result.output.includes('403.html'));
    });

    it('shows help with -h flag', () => {
      const result = runSiteCheck('-h');
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('Usage:'));
    });

  });

  describe('Valid Site Fixtures', () => {

    it('passes site with complete infrastructure', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.strictEqual(result.success, true, `Expected success but got: ${result.output}`);
      assert.ok(result.output.includes('PASS'));
      assert.ok(result.output.includes('All checks passed'));
    });

    it('detects all favicon files', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('favicon.ico exists'));
      assert.ok(result.output.includes('icon.svg exists'));
      assert.ok(result.output.includes('apple-touch-icon.png exists'));
    });

    it('validates robots.txt content', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('robots.txt exists'));
      assert.ok(result.output.includes('Has User-agent directive'));
      assert.ok(result.output.includes('References sitemap'));
    });

    it('detects AI/LLM crawler directives in robots.txt', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('Contains AI/LLM crawler directives'));
    });

    it('validates sitemap.xml', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('sitemap.xml exists'));
      assert.ok(result.output.includes('Valid sitemap structure'));
      assert.ok(result.output.includes('Contains 2 URLs'));
    });

    it('validates manifest.webmanifest', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('manifest.webmanifest exists'));
      assert.ok(result.output.includes('Has name:'));
      assert.ok(result.output.includes('Has 3 icon(s) defined'));
      assert.ok(result.output.includes('Has start_url'));
    });

    it('detects custom 404 page', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('Custom 404 page: 404.html'));
      assert.ok(result.output.includes('404 page has title'));
    });

    it('validates llms.txt', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('llms.txt exists'));
      assert.ok(result.output.includes('Includes site purpose/about section'));
      assert.ok(result.output.includes('Includes contact information'));
    });

    it('detects all error pages (404, 500, 403)', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('Custom 404 page: 404.html'));
      assert.ok(result.output.includes('Custom 500 page: 500.html'));
      assert.ok(result.output.includes('Custom 403 page: 403.html'));
    });

    it('validates .well-known/security.txt', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('.well-known/security.txt exists'));
      assert.ok(result.output.includes('Has Contact field'));
      assert.ok(result.output.includes('Has Expires field'));
    });

    it('detects security.txt optional fields', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('Has Encryption field'));
      assert.ok(result.output.includes('Has Preferred-Languages field'));
      assert.ok(result.output.includes('Has Canonical field'));
      assert.ok(result.output.includes('Has Policy field'));
    });

    it('validates opensearch.xml', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('opensearch.xml exists'));
      assert.ok(result.output.includes('Valid OpenSearch structure'));
      assert.ok(result.output.includes('Has search URL template'));
    });

    it('validates humans.txt', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('humans.txt exists'));
      assert.ok(result.output.includes('Includes team/author information'));
      assert.ok(result.output.includes('Includes site/technology information'));
    });

  });

  describe('Invalid Site Fixtures', () => {

    it('fails site missing required files', () => {
      const result = runSiteCheck('test/fixtures/invalid/site-check/');
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.output.includes('FAIL'));
    });

    it('reports missing favicon.ico as error', () => {
      const result = runSiteCheck('test/fixtures/invalid/site-check/');
      assert.ok(result.output.includes('Missing required: favicon.ico'));
    });

    it('reports missing apple-touch-icon as error', () => {
      const result = runSiteCheck('test/fixtures/invalid/site-check/');
      assert.ok(result.output.includes('Missing required: apple-touch-icon.png'));
    });

    it('reports missing robots.txt as error', () => {
      const result = runSiteCheck('test/fixtures/invalid/site-check/');
      assert.ok(result.output.includes('Missing robots.txt'));
    });

    it('reports missing icon.svg as warning', () => {
      const result = runSiteCheck('test/fixtures/invalid/site-check/');
      assert.ok(result.output.includes('Missing recommended: icon.svg'));
    });

  });

  describe('Strict Mode', () => {

    it('treats warnings as errors with --strict flag', () => {
      // The invalid fixture has warnings, so strict mode should fail
      const result = runSiteCheck('--strict test/fixtures/invalid/site-check/');
      assert.strictEqual(result.success, false);
    });

  });

  describe('Edge Cases', () => {

    it('handles non-existent directory gracefully', () => {
      const result = runSiteCheck('nonexistent-directory-12345/');
      assert.strictEqual(result.success, false);
      const allOutput = result.output + (result.stderr || '');
      assert.ok(allOutput.includes('Directory not found') || allOutput.includes('No site roots found'));
    });

    it('reports total sites checked', () => {
      const result = runSiteCheck('test/fixtures/valid/site-check/');
      assert.ok(result.output.includes('1 site(s) checked'));
    });

  });

});
