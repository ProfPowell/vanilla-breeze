#!/usr/bin/env node
/**
 * One-shot migration from raw-length layout values to the token vocabulary.
 * See admin/specs/layout-value-vocabulary-v1.md.
 *
 * Usage:
 *   node scripts/migrate-layout-values.mjs --dry-run
 *   node scripts/migrate-layout-values.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { readLayoutVocabulary } from './quality/layout-vocabulary.js';

const dryRun = process.argv.includes('--dry-run');

/** Raw value → token, per layout context. */
const GRID_MIN = {
  '4rem': 'xs', '6rem': 'xs', '8rem': 'xs', '80px': 'xs', '120px': 'xs', '140px': 'xs',
  '150px': 's', '180px': 's', '10rem': 's', '12rem': 's',
  '200px': 'm', '220px': 'm', '240px': 'm', '250px': 'm', '260px': 'm',
  '14rem': 'm', '15rem': 'm', '16rem': 'm',
  '280px': 'l', '300px': 'l', '320px': 'l', '18rem': 'l', '20rem': 'l', '22rem': 'l',
  '360px': 'xl', '400px': 'xl', '25rem': 'xl',
};
const COVER_MIN = {
  '50vh': 's', '60vh': 'm', '70vh': 'm', '75vh': 'l', '80vh': 'l',
  '100vh': 'xl', '100svh': 'xl', '100dvh': 'xl', 'auto': 'auto',
};
const THRESHOLD = { '20rem': 's', '25rem': 's', '30rem': 'm', '35rem': 'l', '40rem': 'l', '45rem': 'l' };
const CONTENT_MIN = { '40': 's', '45': 'm', '50': 'm', '60': 'l' };

/** Values with no token — move to the escape hatch instead. */
const NO_TOKEN = /^\d+(\.\d+)?%$/;

const vocab = readLayoutVocabulary();
const manual = [];

/**
 * Is this tag a cover? Decides which min map applies.
 *
 * @param {string} tag - The full opening tag text.
 * @returns {boolean}
 */
const isCover = (tag) => /<layout-cover\b/.test(tag) || /data-layout="cover"/.test(tag);

const files = execSync(
  "find demos site/src -name '*.html' -o -name '*.njk'",
  { encoding: 'utf8' },
).trim().split('\n').filter(Boolean);

let changed = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');

  const after = before.replace(/<[a-z][^>]*>/gi, (tag) => {
    return tag.replace(/data-layout-(min|threshold|content-min)="([^"]*)"/g, (whole, attr, value) => {
      const map = attr === 'threshold' ? THRESHOLD
        : attr === 'content-min' ? CONTENT_MIN
        : isCover(tag) ? COVER_MIN : GRID_MIN;

      if (map[value]) return `data-layout-${attr}="${map[value]}"`;

      // Already a token — leave it.
      if (vocab.get(attr)?.has(value)) return whole;

      if (NO_TOKEN.test(value)) {
        manual.push(`${file}: data-layout-${attr}="${value}" → style="--layout-${attr}: ${value}"`);
        return whole;
      }

      manual.push(`${file}: data-layout-${attr}="${value}" — UNMAPPED, review by hand`);
      return whole;
    });
  });

  if (after !== before) {
    changed++;
    if (!dryRun) writeFileSync(file, after);
  }
}

console.log(`${dryRun ? '[dry run] ' : ''}${changed} file(s) ${dryRun ? 'would change' : 'changed'} of ${files.length} scanned`);
if (manual.length) {
  console.log(`\n${manual.length} usage(s) need manual handling:`);
  manual.forEach((m) => console.log('  ' + m));
}
