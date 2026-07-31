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

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');

/** Matches data-layout-<name>="<value>" in CSS selectors and in HTML. */
export const LAYOUT_ATTR_RE = /data-layout-([a-z-]+)="([^"]*)"/g;

/**
 * Matches a bare presence selector — `[data-layout-centered]`, or the
 * element-fork equivalent `nav[data-layout-sticky]` — where the attribute
 * name is followed directly by the closing bracket, with no `="value"`.
 * The trailing `\]` in the pattern is what excludes
 * `[data-layout-min="m"]`: the character after the name there is `=`, not
 * `]`, so it never matches.
 */
export const PRESENCE_ATTR_RE = /\[data-layout-([a-z-]+)\]/g;

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
 * @throws if layout-attributes.css is missing or unreadable (required file)
 */
function vocabularyFiles(root) {
  const base = join(root, 'src', 'custom-elements');
  const requiredFile = join(base, 'layout-attributes.css');

  // Required file — throw if missing or unreadable.
  if (!existsSync(requiredFile)) {
    throw new Error(`Required vocabulary file missing: ${requiredFile}`);
  }

  const files = [requiredFile];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('layout-')) {
      const styleFile = join(base, entry.name, 'styles.css');
      // Optional files — skip if missing, but error on read failure.
      if (existsSync(styleFile)) {
        files.push(styleFile);
      }
    }
  }
  return files;
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

/**
 * Attributes whose CSS contract is presence, not value — `[data-layout-X]`
 * with no `="..."`, and NO `[data-layout-X="..."]` selector anywhere else
 * in the CSS. A presence selector matches the attribute no matter what
 * value it holds (including `""`), so there is no value vocabulary to
 * check for these: `data-layout-centered=""` is exactly as valid as bare
 * `data-layout-centered`.
 *
 * The rule is deliberately structural and binary — bare form exists AND
 * zero value-bearing selectors exist — not "does the bare selector look
 * like a boolean flag." An earlier version of this function tried to keep
 * `subgrid`/`overlap`/`threshold` in this set (their bare selector sets a
 * complete fallback: `[data-layout="grid"][data-layout-subgrid] > *`
 * defaults to a 3-row span, `margin-inline-start: var(--_overlap,
 * -0.5rem)` has its own fallback, `flex-wrap: wrap-reverse` doesn't
 * reference the threshold token at all) by counting how many distinct
 * layout modes each attribute's value-bearing form spans. That heuristic
 * was wrong: it exempted `threshold` and `overlap` from validation
 * entirely — `data-layout-threshold="99rem"` and `data-layout-overlap="99px"`
 * both went unflagged, silently unprotecting two of the three attributes
 * this whole vocabulary effort was built to tokenize (see
 * admin/specs/layout-value-vocabulary-v1.md). A bare selector coexisting
 * with `="value"` selectors for the SAME attribute means "this rule
 * applies whatever the value is" (a catch-all guard layered under the
 * specific-token rules) — it does not mean the attribute has no vocabulary
 * to validate against. If any value-bearing selector exists for an
 * attribute, that attribute has a real vocabulary and must be checked;
 * the bare form is irrelevant to validation once that's true. `subgrid`,
 * `overlap`, `threshold`, and `gap` (all of which have both forms) are
 * therefore NOT presence-only under this rule.
 *
 * @param {string} [root] - Repo root; defaults to the checkout this file is in.
 * @returns {Set<string>} attribute names (no prefix) that are presence-only
 */
export function readPresenceAttrs(root = DEFAULT_ROOT) {
  const bareAttrs = new Set();
  const valuedAttrs = new Set();

  for (const file of vocabularyFiles(root)) {
    const css = readFileSync(file, 'utf8');
    for (const [, attr] of css.matchAll(PRESENCE_ATTR_RE)) {
      bareAttrs.add(attr);
    }
    for (const [, attr] of css.matchAll(LAYOUT_ATTR_RE)) {
      valuedAttrs.add(attr);
    }
  }

  const presenceAttrs = new Set();
  for (const attr of bareAttrs) {
    if (!valuedAttrs.has(attr)) presenceAttrs.add(attr);
  }
  return presenceAttrs;
}
