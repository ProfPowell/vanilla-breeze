/**
 * CLI Integration Tests
 * Tests the CLI as a whole using child_process
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, '../bin/{{COMMAND_NAME}}.js');

/**
 * Run CLI command and return output
 * @param {string[]} args - CLI arguments
 * @param {Object} [options] - execSync options
 * @returns {string} stdout
 */
function runCli(args, options = {}) {
  return execSync(`node ${CLI_PATH} ${args.join(' ')}`, {
    encoding: 'utf-8',
    ...options,
  });
}

/**
 * Run CLI command expecting it to fail
 * @param {string[]} args - CLI arguments
 * @returns {{ status: number, stderr: string }}
 */
function runCliFail(args) {
  try {
    execSync(`node ${CLI_PATH} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    assert.fail('Expected command to fail');
  } catch (error) {
    return {
      status: error.status,
      stderr: error.stderr || '',
      stdout: error.stdout || '',
    };
  }
}

describe('{{COMMAND_NAME}} CLI', () => {
  describe('--help', () => {
    it('should show help with --help', () => {
      const output = runCli(['--help']);
      assert.match(output, /Usage:/);
      assert.match(output, /Options:/);
    });

    it('should show help with -h', () => {
      const output = runCli(['-h']);
      assert.match(output, /Usage:/);
    });
  });

  describe('--version', () => {
    it('should show version with --version', () => {
      const output = runCli(['--version']);
      assert.match(output.trim(), /^\d+\.\d+\.\d+/);
    });

    it('should show version with -v', () => {
      const output = runCli(['-v']);
      assert.match(output.trim(), /^\d+\.\d+\.\d+/);
    });
  });

{{#IF_SIMPLE}}
  describe('file processing', () => {
    it('should error when no files provided', () => {
      const result = runCliFail([]);
      assert.strictEqual(result.status, 1);
      assert.match(result.stdout + result.stderr, /No files specified/i);
    });

    // Add more tests for your file processing logic
  });
{{/IF_SIMPLE}}

{{#IF_MULTI_COMMAND}}
  describe('commands', () => {
    it('should show help for unknown command', () => {
      const result = runCliFail(['unknown-command']);
      assert.strictEqual(result.status, 1);
      assert.match(result.stdout + result.stderr, /Unknown command/);
    });

    it('should run help command', () => {
      const output = runCli(['help']);
      assert.match(output, /Usage:/);
      assert.match(output, /Commands:/);
    });

    // Add tests for your custom commands
  });
{{/IF_MULTI_COMMAND}}

{{#IF_INTERACTIVE}}
  // Interactive tests are harder to automate
  // Consider testing the wizard logic separately
  describe('interactive mode', () => {
    it('should be testable with mocked prompts', () => {
      // TODO: Add tests with mocked stdin
      assert.ok(true, 'Placeholder for interactive tests');
    });
  });
{{/IF_INTERACTIVE}}

  describe('error handling', () => {
    it('should exit 1 for unknown options in strict mode', () => {
      // Note: Default is not strict, so this may pass
      // Adjust based on your strict mode configuration
      assert.ok(true, 'Placeholder for error handling tests');
    });
  });
});
