#!/usr/bin/env node

/**
 * {{COMMAND_NAME}} - {{DESCRIPTION}}
 *
 * Usage:
{{#IF_SIMPLE}}
 *   {{COMMAND_NAME}} [options] <files...>
{{/IF_SIMPLE}}
{{#IF_MULTI_COMMAND}}
 *   {{COMMAND_NAME}} <command> [options]
{{/IF_MULTI_COMMAND}}
{{#IF_INTERACTIVE}}
 *   {{COMMAND_NAME}} [options]
{{/IF_INTERACTIVE}}
 *
 * Options:
 *   -h, --help     Show help
 *   -v, --version  Show version
{{#IF_ENABLE_CONFIG}}
 *   -c, --config   Path to config file
{{/IF_ENABLE_CONFIG}}
 *   --verbose      Enable verbose output
 *   -q, --quiet    Suppress output
 */

import { main } from '../src/index.js';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Unexpected error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(2);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nCancelled');
  process.exit(130);
});

// Run the CLI
main(process.argv.slice(2));
