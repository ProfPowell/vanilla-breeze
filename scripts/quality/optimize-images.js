#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Generates optimized WebP and AVIF versions of JPEG/PNG images.
 * Also creates multiple sizes for srcset usage.
 *
 * Usage:
 *   node scripts/optimize-images.js [directories...]
 *   node scripts/optimize-images.js examples/pages examples/demo-site
 *
 * Options:
 *   --sizes    Generate multiple sizes for srcset (400, 800, 1200)
 *   --dry-run  Show what would be done without making changes
 */

import { readdir, stat, mkdir } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import sharp from 'sharp';

// Configuration
const CONFIG = {
  sourceFormats: ['.jpg', '.jpeg', '.png'],
  outputFormats: ['webp', 'avif'],
  quality: {
    webp: 82,
    avif: 65,
    jpeg: 85,
    png: 85,
  },
  srcsetWidths: [400, 800, 1200],
  defaultDirs: ['src'],
};

// Parse command line arguments
const args = process.argv.slice(2);
const generateSizes = args.includes('--sizes');
const dryRun = args.includes('--dry-run');
const directories = args.filter(arg => !arg.startsWith('--'));

if (directories.length === 0) {
  directories.push(...CONFIG.defaultDirs);
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Get all source image files in a directory recursively
 */
async function getSourceImages(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await getSourceImages(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (CONFIG.sourceFormats.includes(ext)) {
          // Skip files that are already optimized versions (e.g., image-400.jpg)
          if (!/-\d+\.(jpg|jpeg|png)$/i.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Warning: Could not read directory: ${dir}`);
    }
  }

  return files;
}

/**
 * Check if file exists
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
 * Generate optimized versions of an image
 */
async function optimizeImage(imagePath) {
  const dir = dirname(imagePath);
  const ext = extname(imagePath);
  const name = basename(imagePath, ext);

  const results = {
    source: imagePath,
    generated: [],
    skipped: [],
    errors: [],
  };

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const sourceStats = await stat(imagePath);

    console.log(`\nProcessing: ${imagePath}`);
    console.log(`  Source: ${metadata.width}x${metadata.height}, ${formatBytes(sourceStats.size)}`);

    // Generate modern format versions
    for (const format of CONFIG.outputFormats) {
      const outputPath = join(dir, `${name}.${format}`);

      if (await fileExists(outputPath)) {
        results.skipped.push(outputPath);
        console.log(`  ⏭️  ${format.toUpperCase()}: Already exists`);
        continue;
      }

      if (dryRun) {
        console.log(`  📝 ${format.toUpperCase()}: Would create ${outputPath}`);
        results.generated.push(outputPath);
        continue;
      }

      try {
        const outputImage = sharp(imagePath);

        if (format === 'webp') {
          await outputImage
            .webp({ quality: CONFIG.quality.webp })
            .toFile(outputPath);
        } else if (format === 'avif') {
          await outputImage
            .avif({ quality: CONFIG.quality.avif })
            .toFile(outputPath);
        }

        const outputStats = await stat(outputPath);
        const savings = ((sourceStats.size - outputStats.size) / sourceStats.size * 100).toFixed(1);

        console.log(`  ✅ ${format.toUpperCase()}: ${formatBytes(outputStats.size)} (${savings}% smaller)`);
        results.generated.push(outputPath);

      } catch (err) {
        console.log(`  ❌ ${format.toUpperCase()}: Error - ${err.message}`);
        results.errors.push({ path: outputPath, error: err.message });
      }
    }

    // Generate multiple sizes if requested
    if (generateSizes) {
      for (const width of CONFIG.srcsetWidths) {
        // Skip if source is smaller than target width
        if (metadata.width <= width) {
          continue;
        }

        for (const format of ['jpg', ...CONFIG.outputFormats]) {
          const sizeExt = format === 'jpg' ? ext : `.${format}`;
          const sizeName = `${name}-${width}${sizeExt}`;
          const outputPath = join(dir, sizeName);

          if (await fileExists(outputPath)) {
            results.skipped.push(outputPath);
            continue;
          }

          if (dryRun) {
            console.log(`  📝 ${width}w ${format.toUpperCase()}: Would create`);
            results.generated.push(outputPath);
            continue;
          }

          try {
            let outputImage = sharp(imagePath).resize(width, null, {
              withoutEnlargement: true,
            });

            if (format === 'webp') {
              await outputImage.webp({ quality: CONFIG.quality.webp }).toFile(outputPath);
            } else if (format === 'avif') {
              await outputImage.avif({ quality: CONFIG.quality.avif }).toFile(outputPath);
            } else if (format === 'jpg') {
              await outputImage.jpeg({ quality: CONFIG.quality.jpeg }).toFile(outputPath);
            }

            const outputStats = await stat(outputPath);
            console.log(`  ✅ ${width}w ${format.toUpperCase()}: ${formatBytes(outputStats.size)}`);
            results.generated.push(outputPath);

          } catch (err) {
            console.log(`  ❌ ${width}w ${format.toUpperCase()}: Error - ${err.message}`);
            results.errors.push({ path: outputPath, error: err.message });
          }
        }
      }
    }

  } catch (err) {
    results.errors.push({ path: imagePath, error: err.message });
    console.log(`  ❌ Error processing: ${err.message}`);
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('Image Optimization');
  console.log('==================');
  console.log(`Directories: ${directories.join(', ')}`);
  console.log(`Output formats: ${CONFIG.outputFormats.join(', ')}`);
  if (generateSizes) {
    console.log(`Srcset widths: ${CONFIG.srcsetWidths.join(', ')}`);
  }
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No files will be created\n');
  }

  // Collect all source images
  const sourceImages = [];
  for (const dir of directories) {
    await getSourceImages(dir, sourceImages);
  }

  if (sourceImages.length === 0) {
    console.log('\nNo source images found (JPEG/PNG).');
    process.exit(0);
  }

  console.log(`\nFound ${sourceImages.length} source image(s)`);

  // Process each image
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const imagePath of sourceImages) {
    const results = await optimizeImage(imagePath);
    totalGenerated += results.generated.length;
    totalSkipped += results.skipped.length;
    totalErrors += results.errors.length;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Generated: ${totalGenerated} file(s)`);
  console.log(`  Skipped (existing): ${totalSkipped} file(s)`);
  if (totalErrors > 0) {
    console.log(`  Errors: ${totalErrors}`);
  }

  if (dryRun) {
    console.log('\n🔍 This was a dry run. Run without --dry-run to create files.');
  } else if (totalGenerated > 0) {
    console.log('\n✅ Optimization complete!');
    console.log('\nRun `npm run lint:images` to verify.');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
