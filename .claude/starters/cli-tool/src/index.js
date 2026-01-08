/**
 * {{COMMAND_NAME}} - {{DESCRIPTION}}
 * @module {{COMMAND_NAME}}
 */

import { parse } from './lib/args.js';
import { success, error, info } from './lib/cli.js';
{{#IF_ENABLE_CONFIG}}
import { loadConfig } from './lib/config.js';
{{/IF_ENABLE_CONFIG}}
{{#IF_INTERACTIVE}}
import { ask, confirm, select } from './lib/prompts.js';
{{/IF_INTERACTIVE}}
{{#IF_MULTI_COMMAND}}
import { commands, runCommand, showHelp } from './commands/index.js';
{{/IF_MULTI_COMMAND}}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
{{COMMAND_NAME}} - {{DESCRIPTION}}

Usage:
{{#IF_SIMPLE}}
  {{COMMAND_NAME}} [options] <files...>
{{/IF_SIMPLE}}
{{#IF_MULTI_COMMAND}}
  {{COMMAND_NAME}} <command> [options]

Commands:
  help          Show this help message
  (add your commands here)
{{/IF_MULTI_COMMAND}}
{{#IF_INTERACTIVE}}
  {{COMMAND_NAME}} [options]
{{/IF_INTERACTIVE}}

Options:
  -h, --help     Show this help message
  -v, --version  Show version number
{{#IF_ENABLE_CONFIG}}
  -c, --config   Path to config file
{{/IF_ENABLE_CONFIG}}
  --verbose      Enable verbose output
  -q, --quiet    Suppress output

Examples:
{{#IF_SIMPLE}}
  {{COMMAND_NAME}} file.txt
  {{COMMAND_NAME}} --verbose *.js
{{/IF_SIMPLE}}
{{#IF_MULTI_COMMAND}}
  {{COMMAND_NAME}} help
  {{COMMAND_NAME}} init my-project
{{/IF_MULTI_COMMAND}}
{{#IF_INTERACTIVE}}
  {{COMMAND_NAME}}
{{/IF_INTERACTIVE}}
`);
}

{{#IF_SIMPLE}}
/**
 * Process files
 * @param {string[]} files - Files to process
 * @param {Object} options - CLI options
 */
async function processFiles(files, options) {
  for (const file of files) {
    if (options.verbose) {
      info(`Processing ${file}...`);
    }

    // TODO: Implement your processing logic here
    success(`Processed ${file}`);
  }
}
{{/IF_SIMPLE}}

{{#IF_INTERACTIVE}}
/**
 * Run interactive wizard
 * @param {Object} options - CLI options
 */
async function runWizard(options) {
  // TODO: Implement your wizard prompts here
  const name = await ask('Project name', 'my-project');
  const type = await select('Project type', ['lib', 'app', 'cli']);
  const shouldContinue = await confirm('Continue?', true);

  if (!shouldContinue) {
    info('Cancelled');
    return;
  }

  if (options.verbose) {
    info(`Creating ${type} project: ${name}`);
  }

  // TODO: Implement your scaffolding logic here
  success(`Created ${name}`);
}
{{/IF_INTERACTIVE}}

/**
 * Main entry point
 * @param {string[]} args - CLI arguments
 */
export async function main(args) {
  const { values, positionals } = parse(args, {
    options: {
      // Add your custom options here
      // output: { type: 'string', short: 'o' },
    },
  });

  // Handle help
  if (values.help) {
    printHelp();
    process.exit(0);
  }

{{#IF_ENABLE_CONFIG}}
  // Load config
  const config = loadConfig({
    configPath: values.config,
    defaults: {
      // Add your default config here
    },
  });

  if (values.verbose && config._configPath) {
    info(`Using config from ${config._configPath}`);
  }
{{/IF_ENABLE_CONFIG}}

{{#IF_MULTI_COMMAND}}
  // Multi-command mode
  const [command = 'help', ...rest] = positionals;

  if (command === 'help' || command === '--help') {
    showHelp();
    process.exit(0);
  }

  await runCommand(command, rest, { ...values, config });
{{/IF_MULTI_COMMAND}}

{{#IF_SIMPLE}}
  // Simple mode - require files
  if (positionals.length === 0) {
    error('No files specified');
    printHelp();
    process.exit(1);
  }

  await processFiles(positionals, values);
{{/IF_SIMPLE}}

{{#IF_INTERACTIVE}}
  // Interactive mode
  await runWizard(values);
{{/IF_INTERACTIVE}}
}
