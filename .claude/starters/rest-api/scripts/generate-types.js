#!/usr/bin/env node
/**
 * @file Generate TypeScript type definitions from JSON Schemas
 * @description Converts JSON Schema files to .d.ts files for JSDoc type checking
 *
 * Usage: npm run generate:types
 *
 * This script generates TypeScript declaration files from JSON Schema definitions.
 * These .d.ts files are used by JSDoc's @typedef imports for type checking.
 */

import { compileFromFile } from 'json-schema-to-typescript';
import { writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, '../schemas');
const OUTPUT_DIR = join(__dirname, '../src/types/generated');

/**
 * Find all JSON schema files recursively
 * @param {string} dir
 * @returns {string[]}
 */
function findSchemaFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);

    if (statSync(fullPath).isDirectory()) {
      files.push(...findSchemaFiles(fullPath));
    } else if (entry.endsWith('.schema.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate TypeScript types from all schemas
 */
async function generateTypes() {
  console.log('Generating TypeScript types from JSON Schemas...\n');

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const schemaFiles = findSchemaFiles(SCHEMAS_DIR);

  if (schemaFiles.length === 0) {
    console.log('No schema files found in', SCHEMAS_DIR);
    return;
  }

  for (const schemaPath of schemaFiles) {
    try {
      const ts = await compileFromFile(schemaPath, {
        bannerComment: '/* Auto-generated from JSON Schema. Do not edit. */',
        style: {
          singleQuote: true
        },
        declareExternallyReferenced: false
      });

      // Create output path mirroring schema directory structure
      const relativePath = relative(SCHEMAS_DIR, schemaPath);
      const outputPath = join(OUTPUT_DIR, relativePath.replace('.schema.json', '.d.ts'));

      // Ensure subdirectory exists
      mkdirSync(dirname(outputPath), { recursive: true });

      writeFileSync(outputPath, ts);
      console.log(`  Generated: ${relative(OUTPUT_DIR, outputPath)}`);
    } catch (err) {
      console.error(`  Error processing ${schemaPath}:`, err.message);
    }
  }

  console.log('\nType generation complete.');
}

generateTypes().catch(err => {
  console.error('Type generation failed:', err);
  process.exit(1);
});
