#!/usr/bin/env node

/**
 * Validate compendium.json against its JSON Schema
 *
 * Uses a lightweight subset check (no AJV dependency).
 * Validates: required fields, types, enum values, patterns, references.
 *
 * Run: node tests/element-visual/compendium/validate.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const dir = import.meta.dirname;
const compendium = JSON.parse(readFileSync(join(dir, 'compendium.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(dir, 'schema.json'), 'utf8'));

const errors = [];

function addError(path, msg) {
  errors.push(`${path}: ${msg}`);
}

// Top-level required fields
for (const field of schema.required) {
  if (!(field in compendium)) {
    addError(`$`, `missing required field "${field}"`);
  }
}

// Version format
if (compendium.version && !/^\d+\.\d+\.\d+$/.test(compendium.version)) {
  addError('$.version', `invalid semver format: "${compendium.version}"`);
}

// Elements array
if (!Array.isArray(compendium.elements)) {
  addError('$.elements', 'must be an array');
} else {
  const elementDef = schema.$defs.element;
  const variantDef = schema.$defs.variant;
  const seenIds = new Set();

  for (let i = 0; i < compendium.elements.length; i++) {
    const el = compendium.elements[i];
    const path = `$.elements[${i}]`;

    // Required fields
    for (const field of elementDef.required) {
      if (!(field in el)) {
        addError(path, `missing required field "${field}"`);
      }
    }

    // ID uniqueness and pattern
    if (el.id) {
      if (seenIds.has(el.id)) {
        addError(`${path}.id`, `duplicate element id "${el.id}"`);
      }
      seenIds.add(el.id);
      if (!/^[a-z][a-z0-9-]*$/.test(el.id)) {
        addError(`${path}.id`, `invalid id format "${el.id}"`);
      }
    }

    // Type enum
    const validTypes = elementDef.properties.type.enum;
    if (el.type && !validTypes.includes(el.type)) {
      addError(`${path}.type`, `invalid type "${el.type}" (expected: ${validTypes.join(', ')})`);
    }

    // Category enum
    const validCategories = elementDef.properties.category.enum;
    if (el.category && !validCategories.includes(el.category)) {
      addError(`${path}.category`, `invalid category "${el.category}" (expected: ${validCategories.join(', ')})`);
    }

    // Variants
    if (!Array.isArray(el.variants)) {
      addError(`${path}.variants`, 'must be an array');
    } else if (el.variants.length === 0) {
      addError(`${path}.variants`, 'must have at least 1 variant');
    } else {
      const seenVariantIds = new Set();

      for (let j = 0; j < el.variants.length; j++) {
        const v = el.variants[j];
        const vpath = `${path}.variants[${j}]`;

        // Required fields
        for (const field of variantDef.required) {
          if (!(field in v)) {
            addError(vpath, `missing required field "${field}"`);
          }
        }

        // Variant ID uniqueness within element
        if (v.id) {
          if (seenVariantIds.has(v.id)) {
            addError(`${vpath}.id`, `duplicate variant id "${v.id}" in element "${el.id}"`);
          }
          seenVariantIds.add(v.id);
          if (!/^[a-z][a-z0-9-]*$/.test(v.id)) {
            addError(`${vpath}.id`, `invalid id format "${v.id}"`);
          }
        }

        // fixtureWidth enum
        const validWidths = ['default', 'wide'];
        if (v.fixtureWidth && !validWidths.includes(v.fixtureWidth)) {
          addError(`${vpath}.fixtureWidth`, `invalid fixtureWidth "${v.fixtureWidth}"`);
        }

        // HTML must be non-empty string
        if (typeof v.html === 'string' && v.html.trim() === '') {
          addError(`${vpath}.html`, 'html must not be empty');
        }

        // setup requires interactive
        if (v.setup && !v.interactive) {
          addError(vpath, 'has "setup" but "interactive" is not true');
        }
      }
    }
  }
}

// Report
if (errors.length > 0) {
  console.error(`\nCompendium validation failed with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
} else {
  const totalVariants = compendium.elements.reduce((sum, el) => sum + el.variants.length, 0);
  console.log(`✓ Compendium valid: ${compendium.elements.length} elements, ${totalVariants} variants`);
}
