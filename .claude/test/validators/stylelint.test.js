/**
 * Stylelint CSS Validator Tests
 *
 * Tests CSS validation using stylelint with the project's configuration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

/**
 * Run stylelint on a file and return the result
 */
function runStylelint(filePath) {
  try {
    const output = execSync(`npx stylelint "${filePath}" --formatter json`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // Parse successful output (no errors)
    try {
      const results = JSON.parse(output || '[]');
      const allWarnings = results.flatMap(r => r.warnings || []);
      if (allWarnings.length === 0) {
        return { success: true, errors: [], output };
      }
      return { success: false, errors: allWarnings, output };
    } catch {
      return { success: true, errors: [], output };
    }
  } catch (error) {
    // Stylelint exits with code 2 when there are errors
    // JSON output goes to stderr when there are errors
    const outputStr = error.stderr
      ? (typeof error.stderr === 'string' ? error.stderr : error.stderr.toString())
      : error.stdout
        ? (typeof error.stdout === 'string' ? error.stdout : error.stdout.toString())
        : '';

    try {
      const results = JSON.parse(outputStr || '[]');
      const allWarnings = results.flatMap(r => r.warnings || []);
      return {
        success: false,
        errors: allWarnings,
        output: outputStr,
      };
    } catch {
      return {
        success: false,
        errors: [{ text: error.message, rule: 'parse-error' }],
        output: outputStr,
      };
    }
  }
}

describe('Stylelint CSS Validation', () => {
  describe('Valid CSS Files', () => {
    it('should pass validation for sample.css with modern CSS features', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      assert.strictEqual(
        result.success,
        true,
        `Valid CSS should pass. Errors: ${JSON.stringify(result.errors, null, 2)}`
      );
    });

    it('should accept CSS layers (@layer)', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      // The sample.css uses @layer extensively
      assert.strictEqual(result.success, true, '@layer should be accepted');
    });

    it('should accept CSS nesting up to depth 3', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      // The sample.css uses nesting within allowed depth
      assert.strictEqual(result.success, true, 'Nesting depth ≤3 should pass');
    });

    it('should accept custom properties', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      // The sample.css uses many custom properties
      assert.strictEqual(result.success, true, 'Custom properties should be accepted');
    });
  });

  describe('Invalid CSS Files', () => {
    it('should detect over-nested selectors (depth > 3)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/bad-nesting.css');
      const result = runStylelint(filePath);

      assert.strictEqual(result.success, false, 'Over-nested CSS should fail');

      const nestingErrors = result.errors.filter(e =>
        e.rule === 'max-nesting-depth'
      );
      assert.ok(
        nestingErrors.length > 0,
        'Should report max-nesting-depth violation'
      );
    });

    it('should detect duplicate properties', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/bad-nesting.css');
      const result = runStylelint(filePath);

      const duplicateErrors = result.errors.filter(e =>
        e.rule === 'declaration-block-no-duplicate-properties'
      );
      assert.ok(
        duplicateErrors.length > 0,
        'Should report duplicate property violation'
      );
    });

    it('should detect empty blocks', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/bad-nesting.css');
      const result = runStylelint(filePath);

      const emptyErrors = result.errors.filter(e =>
        e.rule === 'block-no-empty'
      );
      assert.ok(
        emptyErrors.length > 0,
        'Should report empty block violation'
      );
    });
  });

  describe('Modern CSS Features', () => {
    it('should accept media query range syntax', () => {
      // sample.css uses: @media (width <= 768px)
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      assert.strictEqual(
        result.success,
        true,
        'Modern media query range syntax should be accepted'
      );
    });

    it('should accept modern color syntax rgb(0 0 0 / 5%)', () => {
      // sample.css uses this syntax
      const filePath = join(projectRoot, 'test/fixtures/valid/sample.css');
      const result = runStylelint(filePath);

      assert.strictEqual(
        result.success,
        true,
        'Modern color syntax should be accepted'
      );
    });
  });
});
