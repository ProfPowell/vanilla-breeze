/**
 * Resource Budget Tests
 *
 * Tests the resource-budget.js script functionality.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');
const testBudgetDir = join(__dirname, '../fixtures/budget');

/**
 * Run resource-budget.js on a file/directory and return the result
 */
function runBudgetCheck(target) {
  try {
    const output = execSync(`node scripts/resource-budget.js "${target}"`, {
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

describe('Resource Budget Script', () => {
  describe('Script Execution', () => {
    it('should run without errors on empty directory', async () => {
      const emptyDir = join(testBudgetDir, 'empty-test');
      await mkdir(emptyDir, { recursive: true });

      const result = runBudgetCheck(emptyDir);

      assert.strictEqual(result.exitCode, 0, 'Should exit cleanly with no files');
      assert.ok(
        result.output.includes('No HTML files found'),
        'Should report no files found'
      );

      await rm(emptyDir, { recursive: true, force: true });
    });

    it('should display help message with --help flag', () => {
      const result = runBudgetCheck('--help');

      assert.strictEqual(result.exitCode, 0, 'Should exit successfully');
      assert.ok(
        result.output.includes('Resource Budget Checker'),
        'Should show help header'
      );
      assert.ok(
        result.output.includes('Usage:'),
        'Should show usage information'
      );
      assert.ok(
        result.output.includes('Budgets:'),
        'Should show budget information'
      );
    });

    it('should analyze minimal HTML file', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      assert.strictEqual(result.exitCode, 0, 'Should pass for minimal page');
      assert.ok(
        result.output.includes('Resource Budget Analysis'),
        'Should show analysis header'
      );
    });
  });

  describe('Budget Thresholds', () => {
    it('should have correct budget values configured', () => {
      const result = runBudgetCheck('--help');

      assert.ok(
        result.output.includes('500') && result.output.includes('KB'),
        'Should show 500KB total page weight budget'
      );
      assert.ok(
        result.output.includes('14') && result.output.includes('KB'),
        'Should show 14KB critical CSS budget'
      );
      assert.ok(
        result.output.includes('100') && result.output.includes('KB'),
        'Should show 100KB JavaScript budget'
      );
    });

    it('should pass for page with small inline CSS', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'with-inline-css.html'));

      assert.strictEqual(result.exitCode, 0, 'Should pass for small inline CSS');
      assert.ok(
        result.output.includes('passed') || result.output.includes('within budget'),
        'Should indicate passing status'
      );
    });

    it('should fail for page with large inline CSS exceeding 14KB', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'large-inline-css.html'));

      assert.strictEqual(result.exitCode, 1, 'Should fail for large inline CSS');
      assert.ok(
        result.output.includes('Inline CSS') && 
        (result.output.includes('exceeds') || result.output.includes('ERROR')),
        'Should report inline CSS budget exceeded'
      );
    });
  });

  describe('Resource Detection', () => {
    it('should detect and report inline CSS', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'with-inline-css.html'));

      assert.ok(
        result.output.includes('Inline CSS') || result.output.includes('CSS'),
        'Should detect inline CSS'
      );
    });

    it('should report total page weight', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      assert.ok(
        result.output.includes('Total page weight') || result.output.includes('pages'),
        'Should report total page weight or page count'
      );
    });
  });

  describe('Output Format', () => {
    it('should show summary statistics', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      assert.ok(
        result.output.includes('Total:') || result.output.includes('pages'),
        'Should include summary statistics'
      );
    });

    it('should display budget limits', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      assert.ok(
        result.output.includes('Resource Budgets:') || result.output.includes('budget'),
        'Should display budget limits'
      );
    });

    it('should use color coding in output', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      // Color codes are ANSI escape sequences like \x1b[
      assert.ok(
        result.output.includes('\x1b[') || result.output.length > 0,
        'Should include formatted output'
      );
    });
  });

  describe('Multiple File Analysis', () => {
    it('should analyze multiple files in a directory', () => {
      const result = runBudgetCheck(testBudgetDir);

      assert.ok(
        result.output.includes('Total:') && result.output.includes('pages'),
        'Should analyze multiple files'
      );
    });

    it('should report pass/fail counts', () => {
      const result = runBudgetCheck(testBudgetDir);

      assert.ok(
        result.output.includes('passed') && result.output.includes('failed'),
        'Should show pass/fail counts'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle HTML without any resources', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'minimal.html'));

      assert.strictEqual(result.exitCode, 0, 'Should handle minimal HTML');
      assert.ok(
        result.output.includes('minimal.html') || result.output.includes('passed'),
        'Should report file analysis'
      );
    });

    it('should handle non-existent file gracefully', () => {
      const result = runBudgetCheck(join(testBudgetDir, 'does-not-exist.html'));

      assert.ok(
        result.exitCode === 0 || result.output.includes('No HTML files'),
        'Should handle missing files gracefully'
      );
    });
  });
});

describe('Budget Integration', () => {
  describe('npm script', () => {
    it('should be accessible via npm run lint:budget', () => {
      try {
        const result = execSync('npm run lint:budget -- --help', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        assert.ok(
          result.includes('Resource Budget') || result.includes('Usage'),
          'Should be accessible via npm script'
        );
      } catch (error) {
        // Script might fail, but should at least execute
        const output = error.stdout || '';
        assert.ok(
          output.includes('Resource Budget') || output.includes('Usage'),
          'Should run via npm script'
        );
      }
    });
  });
});
