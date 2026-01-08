/**
 * Help Command
 * Shows help for specific commands or general usage
 */

import { showHelp, commands } from './index.js';
import { info } from '../lib/cli.js';

/**
 * Run the help command
 * @param {string[]} args - Command arguments
 * @param {Object} options - Global options
 */
export async function run(args, options) {
  const [commandName] = args;

  if (!commandName) {
    showHelp();
    return;
  }

  if (!commands[commandName]) {
    info(`Unknown command: ${commandName}`);
    showHelp();
    return;
  }

  // Show command-specific help
  // Commands can export a helpText property
  try {
    const mod = await commands[commandName]();
    if (mod.helpText) {
      console.log(mod.helpText);
    } else {
      info(`No detailed help available for '${commandName}'`);
    }
  } catch {
    info(`No detailed help available for '${commandName}'`);
  }
}

export const helpText = `
Usage: {{COMMAND_NAME}} help [command]

Show help for a specific command or general usage.

Examples:
  {{COMMAND_NAME}} help
  {{COMMAND_NAME}} help init
`;