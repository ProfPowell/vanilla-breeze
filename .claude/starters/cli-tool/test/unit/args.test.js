/**
 * Argument Parsing Unit Tests
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert';

// We need to mock process.exit since parse() may call it
// Import after setting up mocks if needed

describe('args module', () => {
  describe('parse()', () => {
    it('should parse boolean flags', async () => {
      // Dynamic import to avoid issues with module initialization
      const { parse } = await import('../../src/lib/args.js');

      const { values } = parse(['--verbose']);
      assert.strictEqual(values.verbose, true);
    });

    it('should parse short flags', async () => {
      const { parse } = await import('../../src/lib/args.js');

      const { values } = parse(['-q']);
      assert.strictEqual(values.quiet, true);
    });

    it('should collect positional arguments', async () => {
      const { parse } = await import('../../src/lib/args.js');

      const { positionals } = parse(['file1.txt', 'file2.txt']);
      assert.deepStrictEqual(positionals, ['file1.txt', 'file2.txt']);
    });

    it('should handle mixed flags and positionals', async () => {
      const { parse } = await import('../../src/lib/args.js');

      const { values, positionals } = parse(['--verbose', 'file.txt', '-q']);
      assert.strictEqual(values.verbose, true);
      assert.strictEqual(values.quiet, true);
      assert.deepStrictEqual(positionals, ['file.txt']);
    });

    it('should accept custom options', async () => {
      const { parse } = await import('../../src/lib/args.js');

      const { values } = parse(['--output', 'dist/'], {
        options: {
          output: { type: 'string', short: 'o' },
        },
      });
      assert.strictEqual(values.output, 'dist/');
    });

{{#IF_ENABLE_CONFIG}}
    it('should parse config option', async () => {
      const { parse } = await import('../../src/lib/args.js');

      const { values } = parse(['-c', 'custom.json']);
      assert.strictEqual(values.config, 'custom.json');
    });
{{/IF_ENABLE_CONFIG}}
  });
});
