#!/usr/bin/env node

/**
 * Config Validator Script
 *
 * Validates JSON and YAML configuration files for syntax errors and common issues.
 * Designed to run as a PostToolUse hook for Edit/Write operations.
 *
 * Usage:
 *   node scripts/config-validator.js path/to/file.json
 *   node scripts/config-validator.js path/to/file.yaml
 *
 * Validates:
 *   - JSON syntax (parse errors, trailing commas)
 *   - YAML syntax (indentation, structure)
 *   - package.json specific checks (missing fields, scripts)
 *   - Common config file patterns
 */

import { readFileSync, existsSync } from 'fs';
import { extname, basename } from 'path';

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {string[]} warnings
 */

/**
 * Validate a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {string} content - File content
 * @returns {ValidationResult}
 */
function validateJson(filePath, content) {
  const errors = [];
  const warnings = [];
  const fileName = basename(filePath);

  // Check for common JSON issues before parsing
  if (content.includes(',]') || content.includes(',}')) {
    errors.push('Trailing comma detected (not valid in JSON)');
  }

  // Try to parse JSON
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const position = parseInt(match[1], 10);
      const lines = content.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      errors.push(`JSON parse error at line ${line}, column ${column}: ${error.message}`);
    } else {
      errors.push(`JSON parse error: ${error.message}`);
    }
    return { valid: false, errors, warnings };
  }

  // package.json specific checks
  if (fileName === 'package.json') {
    if (!parsed.name) {
      warnings.push('package.json: missing "name" field');
    }
    if (!parsed.version) {
      warnings.push('package.json: missing "version" field');
    }
    if (!parsed.type) {
      warnings.push('package.json: consider adding "type": "module" for ESM');
    }
    if (parsed.dependencies && parsed.devDependencies) {
      const deps = Object.keys(parsed.dependencies);
      const devDeps = Object.keys(parsed.devDependencies);
      const duplicates = deps.filter(d => devDeps.includes(d));
      if (duplicates.length > 0) {
        warnings.push(`package.json: packages in both dependencies and devDependencies: ${duplicates.join(', ')}`);
      }
    }
  }

  // tsconfig.json specific checks
  if (fileName === 'tsconfig.json') {
    if (parsed.compilerOptions) {
      if (!parsed.compilerOptions.strict) {
        warnings.push('tsconfig.json: consider enabling "strict" mode');
      }
    }
  }

  // .eslintrc.json checks
  if (fileName === '.eslintrc.json' || fileName === 'eslint.config.json') {
    if (!parsed.extends && !parsed.rules) {
      warnings.push('eslint config: no extends or rules defined');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a YAML file
 * @param {string} filePath - Path to the YAML file
 * @param {string} content - File content
 * @returns {ValidationResult}
 */
function validateYaml(filePath, content) {
  const errors = [];
  const warnings = [];
  const lines = content.split('\n');

  // Basic YAML validation (without external dependencies)
  let indentStack = [0];
  let inMultilineString = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Check for tabs (YAML should use spaces)
    if (line.includes('\t')) {
      errors.push(`Line ${lineNum}: tabs not allowed in YAML, use spaces`);
    }

    // Check multiline string indicators
    if (trimmed.endsWith('|') || trimmed.endsWith('>') || trimmed.endsWith('|-') || trimmed.endsWith('>-')) {
      inMultilineString = true;
      continue;
    }

    // Calculate indentation
    const indent = line.length - line.trimStart().length;

    // Check for inconsistent indentation
    if (indent % 2 !== 0) {
      warnings.push(`Line ${lineNum}: odd indentation (${indent} spaces), consider using 2-space increments`);
    }

    // Check for key: value format
    if (trimmed.includes(':') && !trimmed.startsWith('-')) {
      const colonIndex = trimmed.indexOf(':');
      const afterColon = trimmed.substring(colonIndex + 1);

      // Check for missing space after colon (unless empty or multiline indicator)
      if (afterColon.length > 0 && !afterColon.startsWith(' ') && !afterColon.match(/^[|>]/)) {
        warnings.push(`Line ${lineNum}: missing space after colon`);
      }
    }

    // Reset multiline flag if indentation decreases
    if (inMultilineString && indent <= indentStack[indentStack.length - 1]) {
      inMultilineString = false;
    }
  }

  // Check for common YAML file-specific issues
  const fileName = basename(filePath);

  if (fileName === '.github/workflows' || filePath.includes('.github/workflows')) {
    if (!content.includes('on:')) {
      warnings.push('GitHub Actions: missing "on:" trigger definition');
    }
    if (!content.includes('jobs:')) {
      warnings.push('GitHub Actions: missing "jobs:" definition');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Main validation function
 * @param {string} filePath - Path to the config file
 */
function validateConfig(filePath) {
  if (!existsSync(filePath)) {
    console.error(`${colors.red}Error: File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  console.log(`${colors.cyan}=== config-validator ===${colors.reset}`);

  /** @type {ValidationResult} */
  let result;

  if (ext === '.json') {
    result = validateJson(filePath, content);
  } else if (ext === '.yaml' || ext === '.yml') {
    result = validateYaml(filePath, content);
  } else {
    console.log(`${colors.dim}Skipping: not a JSON/YAML file${colors.reset}`);
    return;
  }

  // Print errors
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.log(`${colors.red}error${colors.reset}: ${error}`);
    }
  }

  // Print warnings
  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.log(`${colors.yellow}warning${colors.reset}: ${warning}`);
    }
  }

  // Print success message
  if (result.valid && result.warnings.length === 0) {
    console.log(`${colors.green}Valid ${ext.substring(1).toUpperCase()} syntax${colors.reset}`);
  } else if (result.valid) {
    console.log(`${colors.green}Valid syntax${colors.reset} (${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'})`);
  }

  // Exit with error code if invalid
  if (!result.valid) {
    process.exit(1);
  }
}

// Main execution
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/config-validator.js <file.json|file.yaml>');
  process.exit(1);
}

validateConfig(filePath);
