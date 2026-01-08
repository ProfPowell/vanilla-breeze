/**
 * CLI Output Utilities
 * Zero-dependency terminal helpers
 */

// Check if colors are supported
const supportsColor = process.stdout.isTTY && !process.env.NO_COLOR;

// ANSI color codes
export const colors = {
  reset: supportsColor ? '\x1b[0m' : '',
  bold: supportsColor ? '\x1b[1m' : '',
  dim: supportsColor ? '\x1b[2m' : '',
  red: supportsColor ? '\x1b[31m' : '',
  green: supportsColor ? '\x1b[32m' : '',
  yellow: supportsColor ? '\x1b[33m' : '',
  blue: supportsColor ? '\x1b[34m' : '',
  magenta: supportsColor ? '\x1b[35m' : '',
  cyan: supportsColor ? '\x1b[36m' : '',
};

/**
 * Apply color to text (respects NO_COLOR)
 * @param {string} color - Color name from colors object
 * @param {string} text - Text to colorize
 * @returns {string}
 */
export function colorize(color, text) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

// Convenience color functions
export const red = (text) => colorize('red', text);
export const green = (text) => colorize('green', text);
export const yellow = (text) => colorize('yellow', text);
export const blue = (text) => colorize('blue', text);
export const cyan = (text) => colorize('cyan', text);
export const magenta = (text) => colorize('magenta', text);
export const dim = (text) => colorize('dim', text);
export const bold = (text) => colorize('bold', text);

/**
 * Print success message
 * @param {string} message
 */
export function success(message) {
  console.log(`${green('✓')} ${message}`);
}

/**
 * Print error message
 * @param {string} message
 */
export function error(message) {
  console.error(`${red('✗')} ${message}`);
}

/**
 * Print warning message
 * @param {string} message
 */
export function warn(message) {
  console.warn(`${yellow('⚠')} ${message}`);
}

/**
 * Print info message
 * @param {string} message
 */
export function info(message) {
  console.log(`${cyan('ℹ')} ${message}`);
}

{{#IF_ENABLE_SPINNER}}
/**
 * Simple text spinner for async operations
 */
export class Spinner {
  /**
   * @param {string} [message='Loading']
   */
  constructor(message = 'Loading') {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.index = 0;
    this.interval = null;
  }

  /**
   * Start the spinner
   */
  start() {
    if (!process.stdout.isTTY) {
      console.log(this.message);
      return;
    }
    this.interval = setInterval(() => {
      const frame = this.frames[this.index];
      process.stdout.write(`\r${cyan(frame)} ${this.message}`);
      this.index = (this.index + 1) % this.frames.length;
    }, 80);
  }

  /**
   * Stop the spinner
   * @param {string} [finalMessage]
   */
  stop(finalMessage = null) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1b[K'); // Clear line
    }
    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  /**
   * Stop with success message
   * @param {string} [message]
   */
  succeed(message = this.message) {
    this.stop();
    success(message);
  }

  /**
   * Stop with error message
   * @param {string} [message]
   */
  fail(message = this.message) {
    this.stop();
    error(message);
  }
}

/**
 * Display a progress bar
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {number} [width=30] - Bar width in characters
 * @returns {string}
 */
export function progressBar(current, total, width = 30) {
  const percent = Math.min(current / total, 1);
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${Math.round(percent * 100)}%`;
}
{{/IF_ENABLE_SPINNER}}
