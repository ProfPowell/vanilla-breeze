#!/usr/bin/env node

/**
 * Auto-Optimize Image Script
 *
 * Triggered by PostToolUse hook when image files are written.
 * Generates WebP and AVIF variants automatically.
 *
 * Usage (via hook):
 *   node .claude/scripts/auto-optimize-image.js "/path/to/image.jpg"
 *
 * Exit codes:
 *   0 - Success (generated or skipped)
 *   1 - Error
 */

import { stat } from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import sharp from 'sharp';

// Configuration (matches optimize-images.js)
const CONFIG = {
  sourceFormats: ['.jpg', '.jpeg', '.png'],
  outputFormats: ['webp', 'avif'],
  quality: {
    webp: 82,
    avif: 65,
  },
};

/**
 * Check if file exists
 * @param {string} path - File path
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Byte count
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Check if file should be processed
 * @param {string} filePath - Path to image file
 * @returns {Promise<{skip: boolean, reason?: string}>} Skip status and reason
 */
async function shouldProcess(filePath) {
  const ext = extname(filePath).toLowerCase();
  const name = basename(filePath);

  // Check if source format
  if (!CONFIG.sourceFormats.includes(ext)) {
    return { skip: true, reason: 'not a source format' };
  }

  // Check if already a srcset variant (e.g., image-400.jpg)
  if (/-\d+\.(jpg|jpeg|png)$/i.test(name)) {
    return { skip: true, reason: 'srcset variant' };
  }

  // Check if modern format siblings already exist
  const dir = dirname(filePath);
  const baseName = basename(filePath, ext);

  const webpExists = await fileExists(join(dir, `${baseName}.webp`));
  const avifExists = await fileExists(join(dir, `${baseName}.avif`));

  if (webpExists && avifExists) {
    return { skip: true, reason: 'variants exist' };
  }

  return { skip: false };
}

/**
 * Generate optimized variants of an image
 * @param {string} imagePath - Path to source image
 * @returns {Promise<{generated: string[], errors: string[]}>} Results
 */
async function generateVariants(imagePath) {
  const dir = dirname(imagePath);
  const ext = extname(imagePath);
  const baseName = basename(imagePath, ext);

  const results = {
    generated: [],
    errors: [],
  };

  for (const format of CONFIG.outputFormats) {
    const outputPath = join(dir, `${baseName}.${format}`);

    // Skip if already exists
    if (await fileExists(outputPath)) {
      continue;
    }

    try {
      const image = sharp(imagePath);

      if (format === 'webp') {
        await image
          .webp({ quality: CONFIG.quality.webp })
          .toFile(outputPath);
      } else if (format === 'avif') {
        await image
          .avif({ quality: CONFIG.quality.avif })
          .toFile(outputPath);
      }

      const outputStats = await stat(outputPath);
      results.generated.push(`${format.toUpperCase()}: ${formatBytes(outputStats.size)}`);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.errors.push(`${format}: ${message}`);
    }
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    // Silent exit if no file provided (hook may call without file)
    process.exit(0);
  }

  // Check if file exists
  if (!(await fileExists(filePath))) {
    // File doesn't exist, likely a delete operation
    process.exit(0);
  }

  // Check if we should process this file
  const check = await shouldProcess(filePath);
  if (check.skip) {
    // Silent skip - don't clutter hook output
    process.exit(0);
  }

  // Generate variants
  const results = await generateVariants(filePath);

  // Output results (kept minimal for hook context)
  if (results.generated.length > 0) {
    console.log(`=== auto-optimize-image ===`);
    console.log(`Source: ${basename(filePath)}`);
    results.generated.forEach(g => console.log(`  + ${g}`));
  }

  if (results.errors.length > 0) {
    console.error(`Errors:`);
    results.errors.forEach(e => console.error(`  ! ${e}`));
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('auto-optimize-image error:', err.message);
  process.exit(1);
});