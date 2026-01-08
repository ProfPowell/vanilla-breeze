# Add Test Command

Scaffold a test file for a JavaScript script using Node.js native test runner.

## Usage

```
/add-test [script-path]
```

## Arguments

- `$ARGUMENTS` - Path to the script to test
  - Examples: `.claude/scripts/my-script.js`
  - Examples: `.claude/scripts/validators/html-check.js`

## Examples

```
/add-test .claude/scripts/config-validator.js
/add-test .claude/scripts/skill-injector.js
/add-test .claude/scripts/metadata-check.js
```

## Steps to Execute

### 1. Parse Arguments

Extract the script path from `$ARGUMENTS`.

If no argument provided, ask the user which script to create tests for.

### 2. Validate Script Exists

Check that the script file exists at the specified path.

### 3. Analyze Script

Read the script to understand:
- Exported functions (to determine what to test)
- Whether it's a CLI tool (has process.argv handling)
- Dependencies it imports
- Error handling patterns

### 4. Determine Test File Path

```
.claude/scripts/foo-bar.js      → .claude/test/validators/foo-bar.test.js
.claude/scripts/utils/helper.js → .claude/test/validators/helper.test.js
```

### 5. Generate Test File

Create the test file with this structure:

```javascript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '../..');

/**
 * Helper to run the script with arguments
 * @param {string} args - Command line arguments
 * @returns {{ success: boolean, output: string, error?: string }}
 */
function runScript(args = '') {
  try {
    const output = execSync(
      `node [SCRIPT_PATH] ${args}`,
      { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe' }
    );
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || ''
    };
  }
}

describe('[Script Name]', () => {
  describe('Valid Cases', () => {
    it('should succeed with valid input', () => {
      // TODO: Test with valid fixture or input
      // const result = runScript('.claude/test/fixtures/valid/example.html');
      // assert.ok(result.success, 'Expected script to succeed');
    });
  });

  describe('Invalid Cases', () => {
    it('should report errors for invalid input', () => {
      // TODO: Test with invalid fixture or input
      // const result = runScript('.claude/test/fixtures/invalid/example.html');
      // assert.ok(!result.success || result.output.includes('error'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing file gracefully', () => {
      const result = runScript('nonexistent-file.xyz');
      assert.ok(!result.success || result.error, 'Expected error for missing file');
    });

    it('should show help with --help flag', () => {
      const result = runScript('--help');
      // Adjust assertion based on whether script supports --help
      // assert.match(result.output, /Usage:/);
    });
  });
});
```

### 6. Create Fixture Directories (If Needed)

If the script validates files, suggest creating fixtures:

```
.claude/test/fixtures/valid/[script-name]/
.claude/test/fixtures/invalid/[script-name]/
```

## Generated Files

For `/add-test .claude/scripts/config-validator.js`:

1. `.claude/test/validators/config-validator.test.js` - Test file with template
2. Suggests: `.claude/test/fixtures/valid/config-validator/` - Valid test fixtures
3. Suggests: `.claude/test/fixtures/invalid/config-validator/` - Invalid test fixtures

## Template Variations

**For CLI Tools (process.argv):**
- Use `runScript()` helper with execSync
- Test command-line arguments
- Test exit codes

**For Module Exports:**
```javascript
import { functionToTest } from '../../.claude/scripts/my-module.js';

it('should return expected value', () => {
  const result = functionToTest(input);
  assert.strictEqual(result, expected);
});
```

**For Async Functions:**
```javascript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  assert.ok(result);
});
```

## Minimum Test Coverage

Every generated test file should include placeholders for:

| Test Type | Purpose |
|-----------|---------|
| Happy path | Normal operation succeeds |
| Invalid input | Errors handled gracefully |
| Edge cases | Boundary conditions (empty, missing, malformed) |
| Help/usage | CLI tools show usage info |

## After Generation

1. Run the test to verify it executes: `node --test .claude/test/validators/[name].test.js`
2. Fill in TODO placeholders with actual test logic
3. Add appropriate fixtures if testing file validation
4. Ensure all three test categories have real assertions

## Notes

- Test files use ESM (`import`/`export`)
- Use `node:test` and `node:assert` (native modules)
- Keep tests focused - one describe block per feature
- Name tests descriptively: "should X when Y"
- Refer to [unit-testing skill](/.claude/skills/unit-testing/SKILL.md) for patterns
