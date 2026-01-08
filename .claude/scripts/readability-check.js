/**
 * Readability Analysis Script
 *
 * Analyzes HTML content for reading level using Flesch-Kincaid scoring.
 *
 * Thresholds:
 * - General content: Grade level < 8
 * - Technical content: Grade level < 12
 *
 * Content is marked as technical via:
 * - <meta name="content-style" content="technical"/>
 * - data-content-style="technical" on <html> or <body>
 *
 * @example
 * node scripts/readability-check.js [files...]
 * node scripts/readability-check.js examples/pages/
 * npm run lint:readability
 */

import rs from 'text-readability';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/** Grade level thresholds */
const THRESHOLDS = {
  general: 8,
  technical: 12,
};

/** Minimum word count for meaningful analysis */
const MIN_WORDS = 50;

/**
 * Recursively find all HTML files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} files - Accumulated files
 * @returns {string[]} Array of file paths
 */
function findHtmlFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === '.beads') {
        continue;
      }
      // Skip invalid test fixtures
      if (fullPath.includes('test/fixtures/invalid')) {
        continue;
      }
      findHtmlFiles(fullPath, files);
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract visible text content from HTML, excluding code and scripts
 * @param {string} html - Raw HTML content
 * @returns {string} Extracted text content
 */
function extractText(html) {
  // Remove script and style tags and their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // Remove code elements (inline and block) - these are technical, not prose
  text = text.replace(/<code\b[^<]*(?:(?!<\/code>)<[^<]*)*<\/code>/gi, ' ');
  text = text.replace(/<pre\b[^<]*(?:(?!<\/pre>)<[^<]*)*<\/pre>/gi, ' ');
  text = text.replace(/<kbd\b[^<]*(?:(?!<\/kbd>)<[^<]*)*<\/kbd>/gi, ' ');
  text = text.replace(/<samp\b[^<]*(?:(?!<\/samp>)<[^<]*)*<\/samp>/gi, ' ');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Detect if content is marked as technical
 * @param {string} html - Raw HTML content
 * @returns {boolean} True if content is technical
 */
function isTechnicalContent(html) {
  // Check meta tag
  if (/<meta\s+name=["']content-style["']\s+content=["']technical["']/i.test(html)) {
    return true;
  }
  // Check data attribute on html or body
  if (/<html[^>]+data-content-style=["']technical["']/i.test(html)) {
    return true;
  }
  if (/<body[^>]+data-content-style=["']technical["']/i.test(html)) {
    return true;
  }
  return false;
}

/**
 * Count words in text
 * @param {string} text - Text content
 * @returns {number} Word count
 */
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Analyze a single HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {object} Analysis results
 */
function analyzeFile(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const text = extractText(html);
  const wordCount = countWords(text);
  const isTechnical = isTechnicalContent(html);
  const threshold = isTechnical ? THRESHOLDS.technical : THRESHOLDS.general;
  const contentType = isTechnical ? 'technical' : 'general';

  // Skip files with insufficient content
  if (wordCount < MIN_WORDS) {
    return {
      file: relative(process.cwd(), filePath),
      skipped: true,
      reason: `Insufficient content (${wordCount} words, minimum ${MIN_WORDS})`,
      wordCount,
    };
  }

  // Calculate readability metrics
  const fleschEase = rs.fleschReadingEase(text);
  const fleschKincaidGrade = rs.fleschKincaidGrade(text);
  const textStandard = rs.textStandard(text);

  // Check against threshold
  const passed = fleschKincaidGrade <= threshold;

  return {
    file: relative(process.cwd(), filePath),
    skipped: false,
    wordCount,
    contentType,
    threshold,
    fleschEase: Math.round(fleschEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    textStandard,
    passed,
  };
}

/**
 * Get Flesch ease interpretation
 * @param {number} score - Flesch Reading Ease score
 * @returns {string} Interpretation
 */
function interpretFleschEase(score) {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}

/**
 * Print results to console
 * @param {object[]} results - Analysis results
 */
function printResults(results) {
  console.log('=== Reading Level Analysis ===\n');

  const analyzed = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);
  const passed = analyzed.filter(r => r.passed);
  const failed = analyzed.filter(r => !r.passed);

  // Print failed files first
  if (failed.length > 0) {
    console.log('Files Exceeding Grade Level Threshold:');
    for (const r of failed) {
      console.log(`\n  ✗ ${r.file}`);
      console.log(`    Grade Level: ${r.fleschKincaidGrade} (threshold: ${r.threshold})`);
      console.log(`    Content Type: ${r.contentType}`);
      console.log(`    Reading Ease: ${r.fleschEase} - ${interpretFleschEase(r.fleschEase)}`);
      console.log(`    Word Count: ${r.wordCount}`);
    }
    console.log('');
  }

  // Print passed files
  if (passed.length > 0) {
    console.log('Files Within Threshold:');
    for (const r of passed) {
      console.log(`  ✓ ${r.file} (grade ${r.fleschKincaidGrade}/${r.threshold})`);
    }
    console.log('');
  }

  // Print skipped files
  if (skipped.length > 0) {
    console.log('Skipped Files:');
    for (const r of skipped) {
      console.log(`  - ${r.file}: ${r.reason}`);
    }
    console.log('');
  }

  // Print summary
  console.log('Summary:');
  console.log(`  Files analyzed: ${analyzed.length}`);
  console.log(`  Files passed: ${passed.length}`);
  console.log(`  Files failed: ${failed.length}`);
  console.log(`  Files skipped: ${skipped.length}`);
  console.log('');

  // Print thresholds
  console.log('Thresholds:');
  console.log(`  General content: Grade level ≤ ${THRESHOLDS.general}`);
  console.log(`  Technical content: Grade level ≤ ${THRESHOLDS.technical}`);
  console.log('');
  console.log('Mark content as technical with:');
  console.log('  <meta name="content-style" content="technical"/>');
  console.log('  or data-content-style="technical" on <html> or <body>');

  return failed.length;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  let files = [];

  if (args.length === 0) {
    // Default: analyze examples directory
    const defaultDirs = ['examples'];
    for (const dir of defaultDirs) {
      try {
        files = files.concat(findHtmlFiles(dir));
      } catch {
        // Directory doesn't exist
      }
    }
  } else {
    // Use provided paths
    for (const arg of args) {
      try {
        const stat = statSync(arg);
        if (stat.isDirectory()) {
          files = files.concat(findHtmlFiles(arg));
        } else if (arg.endsWith('.html')) {
          files.push(arg);
        }
      } catch {
        console.error(`Warning: Could not access ${arg}`);
      }
    }
  }

  if (files.length === 0) {
    console.log('No HTML files found to analyze.');
    process.exit(0);
  }

  // Analyze all files
  const results = files.map(f => analyzeFile(f));

  // Print results
  const failedCount = printResults(results);

  // Exit with error if any files failed
  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
