/**
 * Configuration Loading
 * Loads config from .{{COMMAND_NAME}}rc, package.json, or custom path
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const CONFIG_FILENAME = '.{{COMMAND_NAME}}rc';
const PKG_CONFIG_KEY = '{{COMMAND_NAME}}';

/**
 * Find config file by walking up directory tree
 * @param {string} startDir - Directory to start from
 * @param {string} filename - Config filename to find
 * @returns {string|null} Path to config file or null
 */
function findUp(startDir, filename) {
  let dir = resolve(startDir);
  const { root } = Object.assign({}, { root: dirname(dir) });
  let prevDir = null;

  while (dir !== prevDir) {
    const configPath = resolve(dir, filename);
    if (existsSync(configPath)) {
      return configPath;
    }
    prevDir = dir;
    dir = dirname(dir);
  }

  return null;
}

/**
 * Load JSON file safely
 * @param {string} filePath - Path to JSON file
 * @returns {Object|null} Parsed JSON or null
 */
function loadJson(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Load configuration from various sources
 * Priority: CLI path > .toolrc > package.json > defaults
 * @param {Object} [options={}]
 * @param {string} [options.configPath] - Explicit config file path
 * @param {string} [options.cwd] - Working directory
 * @param {Object} [options.defaults] - Default configuration
 * @returns {Object} Merged configuration
 */
export function loadConfig({ configPath, cwd = process.cwd(), defaults = {} } = {}) {
  let config = { ...defaults };

  // Try explicit config path first
  if (configPath) {
    const loaded = loadJson(configPath);
    if (loaded) {
      return { ...config, ...loaded, _configPath: configPath };
    }
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  // Try .toolrc file
  const rcPath = findUp(cwd, CONFIG_FILENAME);
  if (rcPath) {
    const loaded = loadJson(rcPath);
    if (loaded) {
      config = { ...config, ...loaded, _configPath: rcPath };
    }
  }

  // Try package.json
  const pkgPath = findUp(cwd, 'package.json');
  if (pkgPath) {
    const pkg = loadJson(pkgPath);
    if (pkg && pkg[PKG_CONFIG_KEY]) {
      config = { ...config, ...pkg[PKG_CONFIG_KEY] };
      if (!config._configPath) {
        config._configPath = pkgPath;
      }
    }
  }

  return config;
}

export { loadConfig as load };