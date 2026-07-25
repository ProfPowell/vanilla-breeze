/**
 * layout-vocabulary — the parsed source of truth for data-layout-* values.
 *
 * The layout system encodes its vocabulary as attribute selectors:
 *
 *   [data-layout="grid"][data-layout-min="m"] { --_min-token: 15rem; }
 *
 * Rather than maintain a second copy of that list for the conformance
 * checker to validate against, read it back out of the CSS. A hand-written
 * copy drifts the moment someone adds a token — which is precisely the
 * failure mode vanilla-breeze-zccp removed from the JS entry points.
 *
 * See admin/specs/layout-value-vocabulary-v1.md.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');

/** Matches data-layout-<name>="<value>" in CSS selectors and in HTML. */
export const LAYOUT_ATTR_RE = /data-layout-([a-z-]+)="([^"]*)"/g;

/** Public custom properties that override a token. */
export const ESCAPE_HATCH_PROPS = new Set([
  '--layout-min',
  '--layout-threshold',
  '--layout-content-min',
]);

/**
 * Every CSS file that defines layout vocabulary.
 *
 * @param {string} root - Repo root.
 * @returns {string[]} absolute paths
 */
function vocabularyFiles(root) {
  const base = join(root, 'src', 'custom-elements');
  const files = [join(base, 'layout-attributes.css')];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('layout-')) {
      files.push(join(base, entry.name, 'styles.css'));
    }
  }
  return files.filter((f) => {
    try {
      readFileSync(f);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Parse the valid value set for every data-layout-* attribute.
 *
 * @param {string} [root] - Repo root; defaults to the checkout this file is in.
 * @returns {Map<string, Set<string>>} attribute name (no prefix) → valid values
 */
export function readLayoutVocabulary(root = DEFAULT_ROOT) {
  const vocab = new Map();
  for (const file of vocabularyFiles(root)) {
    const css = readFileSync(file, 'utf8');
    for (const [, attr, value] of css.matchAll(LAYOUT_ATTR_RE)) {
      if (!vocab.has(attr)) vocab.set(attr, new Set());
      vocab.get(attr).add(value);
    }
  }
  return vocab;
}
