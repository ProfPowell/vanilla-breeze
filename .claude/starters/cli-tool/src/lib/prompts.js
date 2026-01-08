/**
 * Interactive Prompts
 * Zero-dependency readline prompts
 */

import { createInterface } from 'node:readline';
import { cyan, dim, bold } from './cli.js';

/**
 * Create readline interface
 * @returns {import('node:readline').Interface}
 */
function createReadline() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a simple question
 * @param {string} question - Question text
 * @param {string} [defaultValue=''] - Default value
 * @returns {Promise<string>}
 */
export async function ask(question, defaultValue = '') {
  const rl = createReadline();
  const defaultHint = defaultValue ? dim(` (${defaultValue})`) : '';

  return new Promise((resolve) => {
    rl.question(`${cyan('?')} ${question}${defaultHint}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Ask for confirmation (y/n)
 * @param {string} question - Question text
 * @param {boolean} [defaultValue=true] - Default value
 * @returns {Promise<boolean>}
 */
export async function confirm(question, defaultValue = true) {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = await ask(`${question} ${dim(`[${hint}]`)}`);

  if (!answer) return defaultValue;
  return answer.toLowerCase().startsWith('y');
}

/**
 * Ask to select from options
 * @param {string} question - Question text
 * @param {string[]} options - Available options
 * @param {number} [defaultIndex=0] - Default option index
 * @returns {Promise<string>}
 */
export async function select(question, options, defaultIndex = 0) {
  console.log(`${cyan('?')} ${question}`);

  options.forEach((opt, i) => {
    const marker = i === defaultIndex ? bold('>') : ' ';
    console.log(`  ${marker} ${i + 1}. ${opt}`);
  });

  const answer = await ask('Enter number', String(defaultIndex + 1));
  const index = parseInt(answer, 10) - 1;

  if (index >= 0 && index < options.length) {
    return options[index];
  }

  return options[defaultIndex];
}

/**
 * Ask for multiple selections
 * @param {string} question - Question text
 * @param {string[]} options - Available options
 * @param {number[]} [defaultIndices=[]] - Default selected indices
 * @returns {Promise<string[]>}
 */
export async function multiSelect(question, options, defaultIndices = []) {
  console.log(`${cyan('?')} ${question} ${dim('(comma-separated numbers)')}`);

  options.forEach((opt, i) => {
    const marker = defaultIndices.includes(i) ? bold('*') : ' ';
    console.log(`  ${marker} ${i + 1}. ${opt}`);
  });

  const defaultStr = defaultIndices.length > 0
    ? defaultIndices.map((i) => i + 1).join(',')
    : '';

  const answer = await ask('Enter numbers', defaultStr);

  if (!answer) {
    return defaultIndices.map((i) => options[i]);
  }

  const indices = answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < options.length);

  return indices.map((i) => options[i]);
}

/**
 * Ask for a password (hidden input)
 * Note: Input is hidden but not masked with asterisks
 * @param {string} question - Question text
 * @returns {Promise<string>}
 */
export async function password(question) {
  return new Promise((resolve) => {
    process.stdout.write(`${cyan('?')} ${question}: `);

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    let input = '';

    const onData = (char) => {
      const c = char.toString();

      if (c === '\n' || c === '\r') {
        if (stdin.isTTY) {
          stdin.setRawMode(wasRaw);
        }
        stdin.removeListener('data', onData);
        stdin.pause();
        console.log(); // New line after hidden input
        resolve(input);
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(130);
      } else if (c === '\u007F' || c === '\b') {
        // Backspace
        input = input.slice(0, -1);
      } else if (c.charCodeAt(0) >= 32) {
        // Printable characters
        input += c;
      }
    };

    stdin.on('data', onData);
  });
}

export { ask, confirm, select, multiSelect, password };