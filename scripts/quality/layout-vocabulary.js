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

/**
 * Matches a valued selector anchored to a specific layout mode —
 * `[data-layout="grid"][data-layout-subgrid="2"]` — capturing (mode, attr).
 * Used only to count how many distinct layout modes give an attribute real
 * token values (see readPresenceAttrs below); this is a narrow, read-only
 * tally for that one purpose, not a general per-mode vocabulary — building
 * that is a separate, deliberately deferred piece of work (the grid/cover
 * `min` merge issue tracked in its own bead).
 */
const CONTEXTUAL_VALUE_RE = /\[data-layout="([a-z-]+)"\]\[data-layout-([a-z-]+)="[^"]*"\]/g;

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
 * with no `="..."`. A presence selector matches the attribute no matter
 * what value it holds (including `""`), so there is no value vocabulary to
 * check for these: `data-layout-centered=""` is exactly as valid as bare
 * `data-layout-centered`.
 *
 * Several attributes (`subgrid`, `overlap`, `threshold`, …) have BOTH a
 * presence selector, scoped to one layout mode, that sets a complete
 * fallback on its own (e.g. `[data-layout="grid"][data-layout-subgrid] > *`
 * defaults to a 3-row span before `="2"`/`="4"` ever narrow it), AND
 * specific-token refinements layered on top within that same mode. Those
 * belong in this set too — any value at all still gets the mode's default
 * treatment, so there is nothing a value check would usefully reject.
 *
 * `gap` is the attribute that makes a naive "any bare `[data-layout-X]`
 * counts" scan wrong: `[data-layout="center"][data-layout-gap]` is a real
 * presence selector (it switches `center` into a flex column), but gap is
 * simultaneously a full token vocabulary reused across ten other layout
 * modes (stack, grid, cover, split, …), and that one local presence rule
 * doesn't set a gap size on its own — an unrecognized value there
 * (`data-layout-gap="0"`) still produces a visibly broken result (no
 * spacing at all), which is exactly the class of bug this vocabulary
 * exists to catch (see the `effects-kitchen-sink.html` fix in this same
 * batch). Attributes reused as real values across 2+ distinct layout modes
 * are excluded from this set for that reason, even where a bare selector
 * also exists in one of those modes.
 *
 * @param {string} [root] - Repo root; defaults to the checkout this file is in.
 * @returns {Set<string>} attribute names (no prefix) that are presence-only
 */
export function readPresenceAttrs(root = DEFAULT_ROOT) {
  const bareAttrs = new Set();
  const modesByAttr = new Map();

  for (const file of vocabularyFiles(root)) {
    const css = readFileSync(file, 'utf8');
    for (const [, attr] of css.matchAll(PRESENCE_ATTR_RE)) {
      bareAttrs.add(attr);
    }
    for (const [, mode, attr] of css.matchAll(CONTEXTUAL_VALUE_RE)) {
      if (!modesByAttr.has(attr)) modesByAttr.set(attr, new Set());
      modesByAttr.get(attr).add(mode);
    }
  }

  const presenceAttrs = new Set();
  for (const attr of bareAttrs) {
    const modeCount = modesByAttr.get(attr)?.size ?? 0;
    if (modeCount < 2) presenceAttrs.add(attr);
  }
  return presenceAttrs;
}
