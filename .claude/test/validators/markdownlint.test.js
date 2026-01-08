/**
 * Markdownlint Validator Tests
 *
 * Tests markdown validation using markdownlint-cli with the project's configuration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

/**
 * Run markdownlint on a file and return the result
 */
function runMarkdownlint(filePath) {
  try {
    execSync(`npx markdownlint "${filePath}"`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, errors: [], output: '' };
  } catch (error) {
    // Markdownlint outputs errors to stderr
    const outputStr = error.stderr
      ? (typeof error.stderr === 'string' ? error.stderr : error.stderr.toString())
      : '';

    // Parse markdownlint output formats:
    // file:line error MD025/single-title/single-h1 Message [Context: "..."]
    // file:line:column error MD034/no-bare-urls Message [Context: "..."]
    const errors = outputStr
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Match: file:line or file:line:column followed by "error" and rule
        const match = line.match(/.*?:(\d+)(?::(\d+))?\s+error\s+(MD\d+\/[\w-]+(?:\/[\w-]+)?)\s+(.*)/);
        if (match) {
          return {
            line: parseInt(match[1], 10),
            column: match[2] ? parseInt(match[2], 10) : 0,
            rule: match[3],
            message: match[4],
          };
        }
        return { rule: 'unknown', message: line };
      })
      .filter(e => e.rule !== 'unknown' || e.message.trim());

    return {
      success: false,
      errors,
      output: outputStr,
    };
  }
}

describe('Markdownlint Validation', () => {
  describe('Valid Markdown Files', () => {
    it('should pass validation for sample.md with proper structure', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      assert.strictEqual(
        result.success,
        true,
        `Valid markdown should pass. Errors: ${JSON.stringify(result.errors, null, 2)}`
      );
    });

    it('should accept ATX-style headings', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const headingErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD003')
      );
      assert.strictEqual(
        headingErrors.length,
        0,
        'ATX-style headings should be accepted'
      );
    });

    it('should accept fenced code blocks with language', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const codeErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD040')
      );
      assert.strictEqual(
        codeErrors.length,
        0,
        'Code blocks with language should be accepted'
      );
    });

    it('should accept proper heading hierarchy', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const hierarchyErrors = result.errors.filter(e =>
        e.rule && (e.rule.includes('MD001') || e.rule.includes('MD025'))
      );
      assert.strictEqual(
        hierarchyErrors.length,
        0,
        'Proper heading hierarchy should be accepted'
      );
    });

    it('should accept dash-style unordered lists', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const listErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD004')
      );
      assert.strictEqual(
        listErrors.length,
        0,
        'Dash-style lists should be accepted'
      );
    });
  });

  describe('Invalid Markdown Files', () => {
    it('should detect multiple H1 headings (MD025)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/markdown/bad-headings.md');
      const result = runMarkdownlint(filePath);

      assert.strictEqual(result.success, false, 'Multiple H1s should fail');

      const h1Errors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD025')
      );
      assert.ok(
        h1Errors.length > 0,
        'Should report multiple H1 violation (MD025)'
      );
    });

    it('should detect skipped heading levels (MD001)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/markdown/bad-headings.md');
      const result = runMarkdownlint(filePath);

      const skipErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD001')
      );
      assert.ok(
        skipErrors.length > 0,
        'Should report heading level skip violation (MD001)'
      );
    });

    it('should detect emphasis used as heading (MD036)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/markdown/bad-headings.md');
      const result = runMarkdownlint(filePath);

      const emphasisErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD036')
      );
      assert.ok(
        emphasisErrors.length > 0,
        'Should report emphasis-as-heading violation (MD036)'
      );
    });

    it('should detect bare URLs (MD034)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/markdown/bad-headings.md');
      const result = runMarkdownlint(filePath);

      const urlErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD034')
      );
      assert.ok(
        urlErrors.length > 0,
        'Should report bare URL violation (MD034)'
      );
    });

    it('should detect inconsistent list style (MD004)', () => {
      const filePath = join(projectRoot, 'test/fixtures/invalid/markdown/bad-headings.md');
      const result = runMarkdownlint(filePath);

      const listErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD004')
      );
      assert.ok(
        listErrors.length > 0,
        'Should report inconsistent list style violation (MD004)'
      );
    });

  });

  describe('Markdown Best Practices', () => {
    it('should enforce single H1 per document', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      // Valid file should have exactly one H1
      assert.strictEqual(
        result.success,
        true,
        'Document with single H1 should pass'
      );
    });

    it('should enforce proper code fence style (backticks)', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const fenceErrors = result.errors.filter(e =>
        e.rule && e.rule.includes('MD048')
      );
      assert.strictEqual(
        fenceErrors.length,
        0,
        'Backtick code fences should be accepted'
      );
    });

    it('should enforce asterisk emphasis style', () => {
      const filePath = join(projectRoot, 'test/fixtures/valid/markdown/sample.md');
      const result = runMarkdownlint(filePath);

      const emphasisErrors = result.errors.filter(e =>
        e.rule && (e.rule.includes('MD049') || e.rule.includes('MD050'))
      );
      assert.strictEqual(
        emphasisErrors.length,
        0,
        'Asterisk emphasis should be accepted'
      );
    });
  });
});
