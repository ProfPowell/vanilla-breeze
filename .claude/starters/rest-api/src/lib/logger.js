/**
 * Logger
 * Structured JSON logging
 */

import { config } from '../config/index.js';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function log(level, data) {
  if (LOG_LEVELS[level] > currentLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...(typeof data === 'string' ? { message: data } : data)
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  error: (data) => log('error', data),
  warn: (data) => log('warn', data),
  info: (data) => log('info', data),
  debug: (data) => log('debug', data)
};
