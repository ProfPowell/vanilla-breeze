/**
 * ESLint JavaScript Validator Tests
 *
 * Tests JavaScript validation using ESLint with the project's configuration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

/**
 * Run ESLint on a file and return the result
 * @param {string} filePath - Path to the file to lint
 * @returns {Object} Result with success status and errors
 */
function runEslint(filePath) {
    try {
        const output = execSync(`npx eslint "${filePath}" --format json`, {
            cwd: projectRoot,
            encoding: 'utf-8',
        });
        const results = JSON.parse(output || '[]');
        const allErrors = results.flatMap((r) => r.messages || []);
        if (allErrors.length === 0) {
            return { success: true, errors: [], output };
        }
        return { success: false, errors: allErrors, output };
    } catch (error) {
        let outputStr = '';
        if (error.stdout) {
            outputStr = typeof error.stdout === 'string' ? error.stdout : error.stdout.toString();
        }
        try {
            const results = JSON.parse(outputStr || '[]');
            const allErrors = results.flatMap((r) => r.messages || []);
            return {
                success: false,
                errors: allErrors,
                output: outputStr,
            };
        } catch {
            return {
                success: false,
                errors: [{ message: error.message, ruleId: 'parse-error' }],
                output: outputStr,
            };
        }
    }
}

describe('ESLint JavaScript Validation', () => {
    describe('Valid JavaScript Files', () => {
        it('should pass validation for well-structured component', () => {
            const filePath = join(projectRoot, 'test/fixtures/valid/good-component.js');
            const result = runEslint(filePath);

            assert.strictEqual(
                result.success,
                true,
                `Valid JS should pass. Errors: ${JSON.stringify(result.errors, null, 2)}`
            );
        });
    });

    describe('Invalid JavaScript Files', () => {
        it('should detect var usage', () => {
            const filePath = join(projectRoot, 'test/fixtures/invalid/eslint/bad-var.js');
            const result = runEslint(filePath);

            assert.strictEqual(result.success, false, 'var usage should fail');

            const varErrors = result.errors.filter((e) =>
                e.ruleId === 'no-var'
            );
            assert.ok(
                varErrors.length > 0,
                `Should report no-var violation. Got: ${JSON.stringify(result.errors.map((e) => e.ruleId))}`
            );
        });

        it('should detect default export', () => {
            const filePath = join(projectRoot, 'test/fixtures/invalid/eslint/default-export.js');
            const result = runEslint(filePath);

            assert.strictEqual(result.success, false, 'Default export should fail');

            const exportErrors = result.errors.filter((e) =>
                e.ruleId === 'no-restricted-exports'
            );
            assert.ok(
                exportErrors.length > 0,
                `Should report no-restricted-exports violation. Got: ${JSON.stringify(result.errors.map((e) => e.ruleId))}`
            );
        });
    });
});
