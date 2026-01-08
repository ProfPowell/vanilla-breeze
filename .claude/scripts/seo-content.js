#!/usr/bin/env node

/**
 * SEO Content Analysis Script
 *
 * Analyzes HTML files for search engine optimization best practices.
 *
 * Checks:
 * - Keyword density (warns if dominant keywords missing from title/description)
 * - Heading structure (proper H1-H6 hierarchy)
 * - Internal linking (minimum internal links for content)
 * - Content length (minimum word count thresholds)
 * - Image alt text keywords (alt text contains relevant terms)
 *
 * @example
 * node scripts/seo-content.js [files...]
 * node scripts/seo-content.js examples/pages/
 * npm run lint:seo
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/** Terminal colors */
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
};

/** SEO thresholds */
const THRESHOLDS = {
  minWords: 300,
  minInternalLinks: 2,
  maxKeywordDensity: 3.0,
  minKeywordDensity: 0.5,
  minAltTextLength: 5,
};

/** Stop words to exclude from keyword analysis */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our',
  'you', 'your', 'i', 'me', 'my', 'he', 'she', 'his', 'her', 'who',
  'what', 'which', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now',
  'here', 'there', 'then', 'if', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'once', 'any', 'get', 'got', 'make', 'made', 'use', 'used',
]);

/**
 * Find HTML files recursively in a directory
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
 * Extract text content from HTML, excluding scripts and styles
 * @param {string} html - Raw HTML content
 * @returns {string} Extracted text
 */
function extractText(html) {
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Extract words from text, filtering stop words
 * @param {string} text - Text content
 * @returns {string[]} Array of meaningful words
 */
function extractWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Count word frequency
 * @param {string[]} words - Array of words
 * @returns {Map<string, number>} Word frequency map
 */
function countWordFrequency(words) {
  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  return freq;
}

/**
 * Get top keywords from content
 * @param {string} text - Text content
 * @param {number} count - Number of keywords to return
 * @returns {Array<{word: string, count: number, density: number}>} Top keywords
 */
function getTopKeywords(text, count = 10) {
  const words = extractWords(text);
  const totalWords = words.length;
  const freq = countWordFrequency(words);

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word, wordCount]) => ({
      word,
      count: wordCount,
      density: totalWords > 0 ? (wordCount / totalWords) * 100 : 0,
    }));
}

/**
 * Extract title from HTML
 * @param {string} html - Raw HTML content
 * @returns {string|null} Title text or null
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract meta description from HTML
 * @param {string} html - Raw HTML content
 * @returns {string|null} Description text or null
 */
function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (match) return match[1];

  const match2 = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  return match2 ? match2[1] : null;
}

/**
 * Extract all headings from HTML
 * @param {string} html - Raw HTML content
 * @returns {Array<{level: number, text: string}>} Headings with levels
 */
function extractHeadings(html) {
  const headings = [];
  const regex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    headings.push({
      level: parseInt(match[1], 10),
      text,
    });
  }

  return headings;
}

/**
 * Check heading structure for SEO issues
 * @param {Array<{level: number, text: string}>} headings - Extracted headings
 * @returns {{errors: string[], warnings: string[]}} Issues found
 */
function checkHeadingStructure(headings) {
  const errors = [];
  const warnings = [];

  if (headings.length === 0) {
    errors.push('No headings found - content should have heading structure');
    return { errors, warnings };
  }

  const h1Count = headings.filter(h => h.level === 1).length;

  if (h1Count === 0) {
    errors.push('Missing H1 heading - every page needs exactly one H1');
  } else if (h1Count > 1) {
    errors.push(`Multiple H1 headings found (${h1Count}) - should have exactly one`);
  }

  if (headings.length > 0 && headings[0].level !== 1) {
    warnings.push(`First heading is H${headings[0].level} - should start with H1`);
  }

  for (let i = 1; i < headings.length; i++) {
    const current = headings[i].level;
    const previous = headings[i - 1].level;

    if (current > previous + 1) {
      warnings.push(`Heading level jumps from H${previous} to H${current} - skipping levels hurts SEO`);
    }
  }

  return { errors, warnings };
}

/**
 * Extract internal links from HTML
 * @param {string} html - Raw HTML content
 * @returns {string[]} Array of internal link hrefs
 */
function extractInternalLinks(html) {
  const links = [];
  const regex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (!href.startsWith('http://') &&
        !href.startsWith('https://') &&
        !href.startsWith('//') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        !href.startsWith('#')) {
      links.push(href);
    }
  }

  return links;
}

/**
 * Extract image alt texts from HTML
 * @param {string} html - Raw HTML content
 * @returns {Array<{src: string, alt: string|null}>} Images with alt texts
 */
function extractImageAlts(html) {
  const images = [];
  const regex = /<img[^>]*>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const imgTag = match[0];
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);

    images.push({
      src: srcMatch ? srcMatch[1] : 'unknown',
      alt: altMatch ? altMatch[1] : null,
    });
  }

  return images;
}

/**
 * Check if keywords appear in text
 * @param {string} text - Text to search
 * @param {Array<{word: string}>} keywords - Keywords to find
 * @returns {string[]} Keywords found in text
 */
function findKeywordsInText(text, keywords) {
  const textLower = text.toLowerCase();
  return keywords
    .filter(k => textLower.includes(k.word))
    .map(k => k.word);
}

/**
 * Analyze a single HTML file for SEO
 * @param {string} filePath - Path to HTML file
 * @returns {object} Analysis results
 */
function analyzeFile(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const text = extractText(html);
  const words = extractWords(text);
  const wordCount = words.length;

  const errors = [];
  const warnings = [];
  const info = [];

  if (wordCount < THRESHOLDS.minWords) {
    warnings.push(`Low word count: ${wordCount} words (recommended: ${THRESHOLDS.minWords}+)`);
  }

  const topKeywords = getTopKeywords(text, 5);

  for (const kw of topKeywords) {
    if (kw.density > THRESHOLDS.maxKeywordDensity) {
      warnings.push(`Keyword "${kw.word}" density too high: ${kw.density.toFixed(1)}% (max: ${THRESHOLDS.maxKeywordDensity}%)`);
    }
  }

  const title = extractTitle(html);
  const description = extractMetaDescription(html);

  if (title && topKeywords.length > 0) {
    const titleKeywords = findKeywordsInText(title, topKeywords);
    if (titleKeywords.length === 0) {
      warnings.push(`Title doesn't contain top content keywords: ${topKeywords.slice(0, 3).map(k => k.word).join(', ')}`);
    }
  }

  if (description && topKeywords.length > 0) {
    const descKeywords = findKeywordsInText(description, topKeywords);
    if (descKeywords.length === 0) {
      warnings.push(`Meta description doesn't contain top content keywords`);
    }
  }

  const headings = extractHeadings(html);
  const headingIssues = checkHeadingStructure(headings);
  errors.push(...headingIssues.errors);
  warnings.push(...headingIssues.warnings);

  const internalLinks = extractInternalLinks(html);
  if (wordCount >= THRESHOLDS.minWords && internalLinks.length < THRESHOLDS.minInternalLinks) {
    warnings.push(`Few internal links: ${internalLinks.length} (recommended: ${THRESHOLDS.minInternalLinks}+ for content pages)`);
  }

  const images = extractImageAlts(html);
  const imagesWithoutAlt = images.filter(img => img.alt === null);
  const imagesWithEmptyAlt = images.filter(img => img.alt === '');
  const imagesWithShortAlt = images.filter(img =>
    img.alt !== null && img.alt !== '' && img.alt.length < THRESHOLDS.minAltTextLength
  );

  if (imagesWithoutAlt.length > 0) {
    errors.push(`${imagesWithoutAlt.length} image(s) missing alt attribute`);
  }

  if (imagesWithShortAlt.length > 0) {
    warnings.push(`${imagesWithShortAlt.length} image(s) with very short alt text`);
  }

  if (topKeywords.length > 0) {
    info.push(`Top keywords: ${topKeywords.map(k => `${k.word} (${k.density.toFixed(1)}%)`).join(', ')}`);
  }

  info.push(`Word count: ${wordCount}`);
  info.push(`Headings: ${headings.length} (H1: ${headings.filter(h => h.level === 1).length})`);
  info.push(`Internal links: ${internalLinks.length}`);
  info.push(`Images: ${images.length} (decorative: ${imagesWithEmptyAlt.length})`);

  return {
    file: relative(process.cwd(), filePath),
    wordCount,
    errors,
    warnings,
    info,
    passed: errors.length === 0,
  };
}

/**
 * Print analysis results
 * @param {object[]} results - Analysis results
 * @returns {number} Number of files with errors
 */
function printResults(results) {
  console.log(`${colors.cyan}=== SEO Content Analysis ===${colors.reset}\n`);

  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  if (failed.length > 0) {
    console.log(`${colors.red}Files with SEO errors:${colors.reset}`);
    for (const r of failed) {
      console.log(`\n${colors.dim}─────────────────────────────────────────${colors.reset}`);
      console.log(`${r.file}`);

      for (const error of r.errors) {
        console.log(`  ${colors.red}✗ ERROR:${colors.reset} ${error}`);
      }

      for (const warning of r.warnings) {
        console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${warning}`);
      }

      for (const i of r.info) {
        console.log(`  ${colors.dim}ℹ ${i}${colors.reset}`);
      }
    }
    console.log('');
  }

  if (passed.length > 0) {
    console.log(`${colors.green}Files passing SEO checks:${colors.reset}`);
    for (const r of passed) {
      const warningCount = r.warnings.length;
      const warningNote = warningCount > 0 ? ` ${colors.yellow}(${warningCount} warnings)${colors.reset}` : '';
      console.log(`  ${colors.green}✓${colors.reset} ${r.file}${warningNote}`);

      if (warningCount > 0) {
        for (const warning of r.warnings) {
          console.log(`    ${colors.yellow}⚠${colors.reset} ${warning}`);
        }
      }
    }
    console.log('');
  }

  console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${results.length} files, ${colors.green}${passed.length} passed${colors.reset}, ${colors.red}${failed.length} failed${colors.reset}`);
  console.log('');

  console.log(`${colors.dim}SEO Thresholds:${colors.reset}`);
  console.log(`  Min words: ${THRESHOLDS.minWords}`);
  console.log(`  Min internal links: ${THRESHOLDS.minInternalLinks}`);
  console.log(`  Keyword density: ${THRESHOLDS.minKeywordDensity}% - ${THRESHOLDS.maxKeywordDensity}%`);
  console.log(`  Min alt text length: ${THRESHOLDS.minAltTextLength} chars`);

  return failed.length;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}SEO Content Analyzer${colors.reset}

Usage:
  node scripts/seo-content.js [options] [files...]

Options:
  --help, -h    Show this help

Examples:
  node scripts/seo-content.js examples/pages/
  node scripts/seo-content.js examples/pages/homepage/index.html
  npm run lint:seo
`);
    process.exit(0);
  }

  let files = [];

  const paths = args.filter(arg => !arg.startsWith('-'));

  if (paths.length === 0) {
    const defaultDirs = ['examples'];
    for (const dir of defaultDirs) {
      try {
        files = files.concat(findHtmlFiles(dir));
      } catch {
        // Directory doesn't exist
      }
    }
  } else {
    for (const arg of paths) {
      try {
        const stat = statSync(arg);
        if (stat.isDirectory()) {
          files = files.concat(findHtmlFiles(arg));
        } else if (arg.endsWith('.html')) {
          files.push(arg);
        }
      } catch {
        console.error(`${colors.yellow}Warning: Could not access ${arg}${colors.reset}`);
      }
    }
  }

  if (files.length === 0) {
    console.log('No HTML files found to analyze.');
    process.exit(0);
  }

  const results = files.map(f => analyzeFile(f));
  const failedCount = printResults(results);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
