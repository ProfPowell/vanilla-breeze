#!/usr/bin/env node

/**
 * JSON-LD / Structured Data validation script
 * Validates Schema.org structured data in HTML files
 *
 * Usage:
 *   node scripts/jsonld-check.js [files...]
 *   node scripts/jsonld-check.js src/index.html
 *   node scripts/jsonld-check.js --type=Article src/blog/*.html
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

/**
 * Schema.org type definitions with required/recommended properties
 */
const schemaTypes = {
  Article: {
    required: ['headline', 'author'],
    recommended: ['datePublished', 'dateModified', 'image', 'publisher', 'description'],
    description: 'News, blog posts, scholarly articles'
  },
  BlogPosting: {
    extends: 'Article',
    required: ['headline', 'author'],
    recommended: ['datePublished', 'dateModified', 'image', 'publisher', 'mainEntityOfPage'],
    description: 'Blog posts'
  },
  NewsArticle: {
    extends: 'Article',
    required: ['headline', 'author', 'datePublished'],
    recommended: ['image', 'publisher', 'dateModified', 'dateline'],
    description: 'News articles'
  },
  Product: {
    required: ['name'],
    recommended: ['image', 'description', 'brand', 'offers', 'sku', 'aggregateRating'],
    description: 'Products for sale'
  },
  Organization: {
    required: ['name'],
    recommended: ['url', 'logo', 'sameAs', 'contactPoint', 'address'],
    description: 'Companies, non-profits, organizations'
  },
  LocalBusiness: {
    extends: 'Organization',
    required: ['name', 'address'],
    recommended: ['telephone', 'openingHours', 'priceRange', 'geo', 'image'],
    description: 'Local businesses with physical locations'
  },
  Person: {
    required: ['name'],
    recommended: ['image', 'jobTitle', 'email', 'telephone', 'url', 'sameAs'],
    description: 'Individual people'
  },
  Event: {
    required: ['name', 'startDate', 'location'],
    recommended: ['endDate', 'description', 'image', 'offers', 'performer', 'organizer'],
    description: 'Events (concerts, conferences, etc.)'
  },
  FAQPage: {
    required: ['mainEntity'],
    recommended: [],
    description: 'FAQ pages with Question/Answer pairs',
    validateMainEntity: (mainEntity) => {
      if (!Array.isArray(mainEntity)) {
        return ['mainEntity should be an array of Question objects'];
      }
      const errors = [];
      mainEntity.forEach((item, i) => {
        if (item['@type'] !== 'Question') {
          errors.push(`mainEntity[${i}] should have @type: Question`);
        }
        if (!item.name) {
          errors.push(`mainEntity[${i}] missing 'name' (the question text)`);
        }
        if (!item.acceptedAnswer) {
          errors.push(`mainEntity[${i}] missing 'acceptedAnswer'`);
        } else if (item.acceptedAnswer['@type'] !== 'Answer') {
          errors.push(`mainEntity[${i}].acceptedAnswer should have @type: Answer`);
        } else if (!item.acceptedAnswer.text) {
          errors.push(`mainEntity[${i}].acceptedAnswer missing 'text'`);
        }
      });
      return errors;
    }
  },
  HowTo: {
    required: ['name', 'step'],
    recommended: ['description', 'image', 'totalTime', 'estimatedCost', 'supply', 'tool'],
    description: 'How-to guides with steps',
    validateStep: (steps) => {
      if (!Array.isArray(steps)) {
        return ['step should be an array of HowToStep objects'];
      }
      const errors = [];
      steps.forEach((step, i) => {
        if (!step['@type'] || step['@type'] !== 'HowToStep') {
          errors.push(`step[${i}] should have @type: HowToStep`);
        }
        if (!step.text && !step.name) {
          errors.push(`step[${i}] missing 'text' or 'name'`);
        }
      });
      return errors;
    }
  },
  Recipe: {
    required: ['name', 'recipeIngredient', 'recipeInstructions'],
    recommended: ['image', 'author', 'datePublished', 'description', 'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'nutrition'],
    description: 'Cooking recipes'
  },
  BreadcrumbList: {
    required: ['itemListElement'],
    recommended: [],
    description: 'Breadcrumb navigation',
    validateItemListElement: (items) => {
      if (!Array.isArray(items)) {
        return ['itemListElement should be an array'];
      }
      const errors = [];
      items.forEach((item, i) => {
        if (item['@type'] !== 'ListItem') {
          errors.push(`itemListElement[${i}] should have @type: ListItem`);
        }
        if (typeof item.position !== 'number') {
          errors.push(`itemListElement[${i}] missing numeric 'position'`);
        }
        if (!item.name && !item.item) {
          errors.push(`itemListElement[${i}] missing 'name' or 'item'`);
        }
      });
      return errors;
    }
  },
  WebSite: {
    required: ['name', 'url'],
    recommended: ['potentialAction', 'description'],
    description: 'Website with optional search action'
  },
  WebPage: {
    required: ['name'],
    recommended: ['description', 'url', 'breadcrumb', 'mainEntity'],
    description: 'Individual web pages'
  }
};

/**
 * Extract JSON-LD blocks from HTML
 */
function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    blocks.push({
      raw: match[1].trim(),
      position: match.index
    });
  }

  return blocks;
}

/**
 * Parse and validate JSON
 */
function parseJsonLd(raw) {
  try {
    const data = JSON.parse(raw);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Validate @context
 */
function validateContext(data) {
  const errors = [];
  const warnings = [];

  if (!data['@context']) {
    errors.push('Missing @context (should be "https://schema.org")');
  } else {
    const context = data['@context'];
    const validContexts = [
      'https://schema.org',
      'http://schema.org',
      'https://schema.org/',
      'http://schema.org/'
    ];

    if (typeof context === 'string' && !validContexts.includes(context)) {
      warnings.push(`Unexpected @context: "${context}" (expected "https://schema.org")`);
    }
  }

  return { errors, warnings };
}

/**
 * Validate @type
 */
function validateType(data, expectedType = null) {
  const errors = [];
  const warnings = [];

  if (!data['@type']) {
    errors.push('Missing @type');
    return { errors, warnings, type: null };
  }

  const type = data['@type'];

  if (expectedType && type !== expectedType) {
    warnings.push(`Expected @type "${expectedType}", got "${type}"`);
  }

  if (!schemaTypes[type]) {
    warnings.push(`Unknown @type "${type}" - validation limited to basic checks`);
  }

  return { errors, warnings, type };
}

/**
 * Validate properties for a known type
 */
function validateProperties(data, type) {
  const errors = [];
  const warnings = [];

  const schema = schemaTypes[type];
  if (!schema) {
    return { errors, warnings };
  }

  // Check required properties
  for (const prop of schema.required) {
    if (data[prop] === undefined || data[prop] === null || data[prop] === '') {
      errors.push(`Missing required property: ${prop}`);
    }
  }

  // Check recommended properties
  for (const prop of schema.recommended) {
    if (data[prop] === undefined) {
      warnings.push(`Missing recommended property: ${prop}`);
    }
  }

  // Run custom validators if defined
  for (const [key, value] of Object.entries(data)) {
    const validatorName = `validate${key.charAt(0).toUpperCase() + key.slice(1)}`;
    if (schema[validatorName] && typeof schema[validatorName] === 'function') {
      const customErrors = schema[validatorName](value);
      errors.push(...customErrors);
    }
  }

  return { errors, warnings };
}

/**
 * Validate nested objects (author, publisher, etc.)
 */
function validateNestedObjects(data) {
  const warnings = [];

  // Check author
  if (data.author) {
    const author = Array.isArray(data.author) ? data.author[0] : data.author;
    if (typeof author === 'object' && !author['@type']) {
      warnings.push('author object missing @type (should be Person or Organization)');
    }
    if (typeof author === 'object' && !author.name) {
      warnings.push('author object missing name');
    }
  }

  // Check publisher
  if (data.publisher) {
    if (!data.publisher['@type']) {
      warnings.push('publisher object missing @type (should be Organization)');
    }
    if (!data.publisher.name) {
      warnings.push('publisher object missing name');
    }
    if (!data.publisher.logo) {
      warnings.push('publisher object missing logo');
    }
  }

  // Check image
  if (data.image) {
    const image = Array.isArray(data.image) ? data.image[0] : data.image;
    if (typeof image === 'object' && !image['@type'] && !image.url) {
      warnings.push('image object should have @type: ImageObject and url property');
    }
  }

  // Check offers (for Product)
  if (data.offers) {
    const offers = Array.isArray(data.offers) ? data.offers : [data.offers];
    offers.forEach((offer, i) => {
      if (!offer['@type']) {
        warnings.push(`offers[${i}] missing @type (should be Offer)`);
      }
      if (!offer.price && offer.price !== 0) {
        warnings.push(`offers[${i}] missing price`);
      }
      if (!offer.priceCurrency) {
        warnings.push(`offers[${i}] missing priceCurrency`);
      }
    });
  }

  return warnings;
}

/**
 * Validate a single JSON-LD block
 */
function validateBlock(block, expectedType = null) {
  const allErrors = [];
  const allWarnings = [];

  // Parse JSON
  const parsed = parseJsonLd(block.raw);
  if (!parsed.success) {
    allErrors.push(`Invalid JSON: ${parsed.error}`);
    return { errors: allErrors, warnings: allWarnings };
  }

  const data = parsed.data;

  // Handle @graph (multiple items)
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    data['@graph'].forEach((item, i) => {
      const { errors, warnings } = validateSingleItem(item, expectedType);
      allErrors.push(...errors.map(e => `@graph[${i}]: ${e}`));
      allWarnings.push(...warnings.map(w => `@graph[${i}]: ${w}`));
    });
    return { errors: allErrors, warnings: allWarnings };
  }

  // Single item
  const { errors, warnings } = validateSingleItem(data, expectedType);
  allErrors.push(...errors);
  allWarnings.push(...warnings);

  return { errors: allErrors, warnings: allWarnings };
}

/**
 * Validate a single JSON-LD item
 */
function validateSingleItem(data, expectedType = null) {
  const errors = [];
  const warnings = [];

  // Validate @context
  const contextResult = validateContext(data);
  errors.push(...contextResult.errors);
  warnings.push(...contextResult.warnings);

  // Validate @type
  const typeResult = validateType(data, expectedType);
  errors.push(...typeResult.errors);
  warnings.push(...typeResult.warnings);

  // Validate properties
  if (typeResult.type && schemaTypes[typeResult.type]) {
    const propResult = validateProperties(data, typeResult.type);
    errors.push(...propResult.errors);
    warnings.push(...propResult.warnings);
  }

  // Validate nested objects
  const nestedWarnings = validateNestedObjects(data);
  warnings.push(...nestedWarnings);

  return { errors, warnings };
}

/**
 * Validate a single file
 */
function validateFile(filePath, expectedType = null) {
  const html = readFileSync(filePath, 'utf-8');
  const blocks = extractJsonLd(html);

  if (blocks.length === 0) {
    return { errors: [], warnings: ['No JSON-LD structured data found'], blockCount: 0 };
  }

  const allErrors = [];
  const allWarnings = [];

  blocks.forEach((block, i) => {
    const prefix = blocks.length > 1 ? `Block ${i + 1}: ` : '';
    const { errors, warnings } = validateBlock(block, expectedType);
    allErrors.push(...errors.map(e => prefix + e));
    allWarnings.push(...warnings.map(w => prefix + w));
  });

  return { errors: allErrors, warnings: allWarnings, blockCount: blocks.length };
}

/**
 * Find HTML files recursively
 */
function findHtmlFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findHtmlFiles(fullPath, files);
      }
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colors.cyan}JSON-LD / Structured Data Validator${colors.reset}

Usage:
  node scripts/jsonld-check.js [options] [files...]

Options:
  --type=TYPE       Expected Schema.org type (Article, Product, etc.)
  --list-types      Show all supported types with descriptions
  --help, -h        Show this help

Examples:
  node scripts/jsonld-check.js src/**/*.html
  node scripts/jsonld-check.js --type=Article src/blog/*.html
  node scripts/jsonld-check.js --list-types

Supported Types:
  ${Object.keys(schemaTypes).join(', ')}
`);
}

/**
 * Show supported types
 */
function showTypes() {
  console.log(`\n${colors.cyan}Supported Schema.org Types${colors.reset}\n`);

  for (const [type, schema] of Object.entries(schemaTypes)) {
    console.log(`${colors.green}${type}${colors.reset}`);
    console.log(`  ${colors.dim}${schema.description}${colors.reset}`);
    console.log(`  Required: ${schema.required.join(', ') || 'none'}`);
    console.log(`  Recommended: ${schema.recommended.join(', ') || 'none'}`);
    console.log();
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let expectedType = null;
  let files = [];

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      expectedType = arg.split('=')[1];
    } else if (arg === '--list-types') {
      showTypes();
      process.exit(0);
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else {
      files.push(arg);
    }
  }

  // If no files specified, find all HTML in src/
  if (files.length === 0) {
    const srcDir = resolve(__dirname, '../src');
    if (existsSync(srcDir)) {
      files = findHtmlFiles(srcDir);
    }

    // Also check examples if it exists
    const examplesDir = resolve(__dirname, '../examples');
    if (existsSync(examplesDir)) {
      files = files.concat(findHtmlFiles(examplesDir));
    }
  }

  if (files.length === 0) {
    console.log(`${colors.yellow}No HTML files found${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.cyan}JSON-LD Validator${colors.reset}`);
  if (expectedType) {
    console.log(`${colors.dim}Expected type: ${expectedType}${colors.reset}`);
  }
  console.log();

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithJsonLd = 0;

  for (const file of files) {
    if (!existsSync(file)) {
      console.log(`${colors.yellow}File not found: ${file}${colors.reset}`);
      continue;
    }

    const { errors, warnings, blockCount } = validateFile(file, expectedType);
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (blockCount > 0) {
      filesWithJsonLd++;
    }

    if (errors.length === 0 && warnings.length === 0) {
      if (blockCount > 0) {
        console.log(`${colors.green}✓${colors.reset} ${file} ${colors.dim}(${blockCount} block${blockCount > 1 ? 's' : ''})${colors.reset}`);
      }
    } else {
      console.log(`${colors.dim}─────────────────────────────────────────${colors.reset}`);
      console.log(`${file} ${colors.dim}(${blockCount} block${blockCount > 1 ? 's' : ''})${colors.reset}`);

      for (const error of errors) {
        console.log(`  ${colors.red}✗ ERROR:${colors.reset} ${error}`);
      }

      for (const warning of warnings) {
        console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${warning}`);
      }
    }
  }

  console.log(`\n${colors.dim}─────────────────────────────────────────${colors.reset}`);
  console.log(`Total: ${files.length} files scanned, ${filesWithJsonLd} with JSON-LD`);
  console.log(`Results: ${colors.red}${totalErrors} errors${colors.reset}, ${colors.yellow}${totalWarnings} warnings${colors.reset}`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
