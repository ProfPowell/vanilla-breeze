/**
 * Argument Parsing Utilities
 * Wrapper around Node.js native util.parseArgs
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get version from package.json
 * @returns {string}
 */
function getVersion() {
  try {
    const pkgPath = resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * @typedef {Object} ParsedArgs
 * @property {Object} values - Named argument values
 * @property {string[]} positionals - Positional arguments
 */

/**
 * Parse CLI arguments with common defaults
 * @param {string[]} args - Process arguments (process.argv.slice(2))
 * @param {Object} [options={}] - Additional parseArgs options
 * @param {Object} [options.options] - Custom option definitions
 * @param {boolean} [options.allowPositionals] - Allow positional args
 * @param {boolean} [options.strict] - Strict mode
 * @returns {ParsedArgs}
 */
export function parse(args, options = {}) {
  const defaultOptions = {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
{{#IF_ENABLE_CONFIG}}
    config: { type: 'string', short: 'c' },
{{/IF_ENABLE_CONFIG}}
    verbose: { type: 'boolean' },
    quiet: { type: 'boolean', short: 'q' },
  };

  const merged = {
    options: { ...defaultOptions, ...options.options },
    allowPositionals: options.allowPositionals ?? true,
    strict: options.strict ?? false,
  };

  try {
    const result = parseArgs({ args, ...merged });

    // Handle --version
    if (result.values.version) {
      console.log(getVersion());
      process.exit(0);
    }

    return result;
  } catch (error) {
    if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      console.error(`Unknown option: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

export { parse as parseArgs };
