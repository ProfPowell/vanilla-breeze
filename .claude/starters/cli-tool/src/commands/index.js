/**
 * Command Registry
 * Git-style subcommand architecture
 */

import { error } from '../lib/cli.js';

/**
 * Available commands
 * Each command exports a run(args, options) function
 */
export const commands = {
  help: () => import('./help.js'),
  // Add your commands here:
  // init: () => import('./init.js'),
  // build: () => import('./build.js'),
};

/**
 * Show available commands
 */
export function showHelp() {
  console.log(`
{{COMMAND_NAME}} - {{DESCRIPTION}}

Usage:
  {{COMMAND_NAME}} <command> [options]

Commands:
${Object.keys(commands)
  .map((cmd) => `  ${cmd.padEnd(12)} ${getCommandDescription(cmd)}`)
  .join('\n')}

Run '{{COMMAND_NAME}} <command> --help' for command-specific help.
`);
}

/**
 * Get command description
 * @param {string} command
 * @returns {string}
 */
function getCommandDescription(command) {
  const descriptions = {
    help: 'Show this help message',
    // Add descriptions for your commands
  };
  return descriptions[command] || '';
}

/**
 * Run a command
 * @param {string} command - Command name
 * @param {string[]} args - Command arguments
 * @param {Object} options - Global options
 */
export async function runCommand(command, args, options) {
  if (!commands[command]) {
    error(`Unknown command: ${command}`);
    console.error(`Run '{{COMMAND_NAME}} help' for available commands`);
    process.exit(1);
  }

  try {
    const { run } = await commands[command]();
    await run(args, options);
  } catch (err) {
    error(`Command '${command}' failed: ${err.message}`);
    if (options.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}
