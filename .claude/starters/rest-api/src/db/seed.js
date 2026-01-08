/**
 * Database Seed Runner
 * Populates database with initial/test data
 */

import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './client.js';
import { logger } from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = join(__dirname, 'seeds');

/**
 * Get list of seed files
 */
async function getSeedFiles() {
  const files = await readdir(SEEDS_DIR);
  return files
    .filter(f => f.endsWith('.js'))
    .sort();
}

/**
 * Run all seed files
 */
export async function seed() {
  const files = await getSeedFiles();

  if (files.length === 0) {
    logger.info('No seed files found');
    return;
  }

  for (const file of files) {
    const seedModule = await import(join(SEEDS_DIR, file));

    logger.info(`Running seed: ${file}`);

    await seedModule.seed(db);

    logger.info(`Completed: ${file}`);
  }

  logger.info(`Ran ${files.length} seed file(s)`);
}

// CLI runner
seed().then(() => process.exit(0)).catch(err => {
  logger.error(err);
  process.exit(1);
});
