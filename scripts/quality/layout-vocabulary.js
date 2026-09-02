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
 * Strip CSS block comments before scanning for selectors. Without this, a
 * commented-out `/* data-layout-min="220px" *\/` would silently widen the
 * parsed vocabulary — the checker exists to catch exactly the kind of
 * unintentional-looking value this would admit. tests/unit/bundle-parity.test.js
 * strips comments the same way for the same reason; keep the two in sync.
 *
 * @param {string} css
 * @returns {string}
 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

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
  // data-layout-density is defined with the other utilities (tfcw), not in a
  // layout-* directory, but it is a data-layout-* attribute with a vocabulary.
  const densityFile = join(root, 'src', 'utils', 'density.css');
  if (existsSync(densityFile)) files.push(densityFile);
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
    const css = stripComments(readFileSync(file, 'utf8'));
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
    const css = stripComments(readFileSync(file, 'utf8'));
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

/**
 * Per-element vocabulary: which data-* attributes each layout element's CSS
 * actually reads, on the host and on its children, with their value sets.
 *
 * This is what a layout's api.json must match (tests/unit/layout-manifests
 * .test.js). It walks every vocabulary file, flattens CSS nesting (`&`), splits
 * each selector into compounds, finds the compound that names the element
 * (`layout-x`, or its attribute form `[data-layout="x"]`), and then reads
 * attribute selectors from that compound (host) and from the compounds after
 * it (children). Compounds before the host — `:root[data-sticky]`,
 * `[data-layout-subgrid] > layout-card` — are context, not API, and are
 * ignored. `:is()` / `:has()` groups inside the host compound are stripped
 * before reading host attributes so `article[data-measure]` listed as a
 * sibling arm does not leak into layout-text's API.
 *
 * @param {string} [root]
 * @returns {Map<string, {host: Map<string, {values: Set<string>, bare: boolean}>, child: Map<string, {values: Set<string>, bare: boolean}>}>}
 *   keyed by element name (e.g. "layout-stack")
 */
export function readLayoutVocabularyByElement(root = DEFAULT_ROOT) {
  const elements = readdirSync(join(root, 'src', 'custom-elements'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('layout-'))
    .map((e) => e.name);
  const out = new Map(elements.map((el) => [el, { host: new Map(), child: new Map() }]));

  const record = (map, attr, value) => {
    if (!map.has(attr)) map.set(attr, { values: new Set(), bare: false });
    if (value == null) map.get(attr).bare = true;
    else map.get(attr).values.add(value);
  };
  const attrsIn = (text) =>
    [...text.matchAll(/\[(data-[a-z0-9-]+)(?:="([^"]*)")?\]/g)].map((m) => [m[1], m[2]]);
  const stripGroups = (text) => {
    // remove :is(...) / :has(...) / :not(...) / :where(...) with nesting
    let out = '';
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      const m = /^:(is|has|not|where)\(/.exec(text.slice(i));
      if (depth === 0 && m) { depth = 1; i += m[0].length - 1; continue; }
      if (depth > 0) { if (text[i] === '(') depth++; else if (text[i] === ')') depth--; continue; }
      out += text[i];
    }
    return out;
  };
  const splitTop = (text, seps) => {
    const parts = [];
    let depth = 0; let cur = '';
    for (const ch of text) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (depth === 0 && seps.includes(ch)) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts.map((p) => p.trim()).filter(Boolean);
  };
  const compounds = (sel) => splitTop(sel.replace(/\s*([>+~])\s*/g, ' $1 '), [' '])
    .filter((c) => !['>', '+', '~'].includes(c));
  const names = (compound) => {
    const found = new Set();
    for (const el of elements) {
      const bare = el;
      if (new RegExp(`(^|[\\s(,])${bare}(?=$|[\\[\\s,:)>])`).test(compound)) found.add(el);
      const attrForm = `[data-layout="${el.replace(/^layout-/, '')}"]`;
      if (compound.includes(attrForm)) found.add(el);
    }
    return found;
  };

  for (const file of vocabularyFiles(root)) {
    const css = stripComments(readFileSync(file, 'utf8'));
    // Walk braces, keeping a stack of resolved selectors (nesting flattened).
    const stack = [];
    let buf = '';
    for (const ch of css) {
      if (ch === '{') {
        const raw = buf.trim().replace(/\s+/g, ' ');
        buf = '';
        if (raw.startsWith('@')) { stack.push(null); continue; }
        const parents = stack.filter(Boolean).at(-1) ?? [''];
        const resolved = [];
        for (const parent of parents) {
          for (const part of splitTop(raw, [','])) {
            resolved.push(part.includes('&') ? part.replaceAll('&', parent) : (parent ? `${parent} ${part}` : part));
          }
        }
        stack.push(resolved);
        for (const sel of resolved) {
          const comps = compounds(sel);
          const hostIdx = comps.findIndex((c) => names(c).size);
          if (hostIdx === -1) continue;
          for (const el of names(comps[hostIdx])) {
            const rec = out.get(el);
            if (!rec) continue;
            for (const [a, v] of attrsIn(stripGroups(comps[hostIdx]))) {
              if (a === 'data-layout' || a === 'data-canvas') continue;
              record(rec.host, a, v);
            }
            for (const c of comps.slice(hostIdx + 1)) {
              for (const [a, v] of attrsIn(c)) {
                if (a === 'data-layout' || a === 'data-canvas') continue;
                record(rec.child, a, v);
              }
            }
          }
        }
      } else if (ch === '}') {
        stack.pop();
        buf = '';
      } else if (ch === ';' && !buf.includes('{')) {
        buf = '';
      } else {
        buf += ch;
      }
    }
  }
  return out;
}

/**
 * Vocabulary keyed by LAYOUT, for cross-context validation.
 *
 * readLayoutVocabulary() merges every layout's value set for an attribute
 * into one — so data-layout-min="auto" passes on a grid because cover reads
 * auto (vanilla-breeze-butz). This reader keeps the layout: it walks the
 * same files, and for every rule whose host compound names a layout —
 * `layout-grid`, `[data-layout="grid"]`, the prefix form
 * `[data-layout^="body-"]` (key "body-*"), or `[data-page-layout]` (key
 * "page-layout") — records the data-layout-* attributes read on that host.
 *
 * Child attributes (`> [data-layout-principal]`) are returned separately:
 * they are read on a child of the layout, so they must not be validated
 * against the child's own layout.
 *
 * @param {string} [root]
 * @returns {{ byLayout: Map<string, Map<string, {values: Set<string>, bare: boolean}>>, childAttrs: Set<string> }}
 *   byLayout keys are layout names without any prefix ("grid", "split",
 *   "body-*", "page-layout"); inner keys are attribute names without the
 *   "data-layout-" prefix, matching readLayoutVocabulary().
 */
export function readLayoutVocabularyByLayout(root = DEFAULT_ROOT) {
  const byLayout = new Map();
  const childAttrs = new Set();
  const record = (layout, attr, value) => {
    if (!byLayout.has(layout)) byLayout.set(layout, new Map());
    const m = byLayout.get(layout);
    if (!m.has(attr)) m.set(attr, { values: new Set(), bare: false });
    if (value == null) m.get(attr).bare = true;
    else m.get(attr).values.add(value);
  };
  const layoutAttrsIn = (text) =>
    [...text.matchAll(/\[data-layout-([a-z-]+)(?:="([^"]*)")?\]/g)].map((m) => [m[1], m[2]]);
  const layoutsIn = (compound) => {
    const found = new Set();
    for (const [, name] of compound.matchAll(/\[data-layout="([a-z-]+)"\]/g)) found.add(name);
    for (const [, prefix] of compound.matchAll(/\[data-layout\^="([a-z-]+)"\]/g)) found.add(`${prefix}*`);
    for (const [, name] of compound.matchAll(/(?:^|[\s(,])layout-([a-z]+)(?=$|[\[\s,:)>])/g)) found.add(name);
    if (/\[data-page-layout(?:=|\])/.test(compound)) found.add('page-layout');
    return found;
  };
  const splitTop = (text, seps) => {
    const parts = [];
    let depth = 0; let cur = '';
    for (const ch of text) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (depth === 0 && seps.includes(ch)) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts.map((p) => p.trim()).filter(Boolean);
  };
  const compounds = (sel) => splitTop(sel.replace(/\s*([>+~])\s*/g, ' $1 '), [' '])
    .filter((c) => !['>', '+', '~'].includes(c));

  for (const file of vocabularyFiles(root)) {
    const css = stripComments(readFileSync(file, 'utf8'));
    const stack = [];
    let buf = '';
    for (const ch of css) {
      if (ch === '{') {
        const raw = buf.trim().replace(/\s+/g, ' ');
        buf = '';
        if (raw.startsWith('@')) { stack.push(null); continue; }
        const parents = stack.filter(Boolean).at(-1) ?? [''];
        const resolved = [];
        for (const parent of parents) {
          for (const part of splitTop(raw, [','])) {
            resolved.push(part.includes('&') ? part.replaceAll('&', parent) : (parent ? `${parent} ${part}` : part));
          }
        }
        stack.push(resolved);
        for (const sel of resolved) {
          const comps = compounds(sel);
          const hostIdx = comps.findIndex((c) => layoutsIn(c).size);
          if (hostIdx === -1) continue;
          for (const layout of layoutsIn(comps[hostIdx])) {
            for (const [a, v] of layoutAttrsIn(comps[hostIdx])) record(layout, a, v);
          }
          for (const c of comps.slice(hostIdx + 1)) {
            for (const [a] of layoutAttrsIn(c)) childAttrs.add(a);
          }
        }
      } else if (ch === '}') {
        stack.pop();
        buf = '';
      } else if (ch === ';' && !buf.includes('{')) {
        buf = '';
      } else {
        buf += ch;
      }
    }
  }
  return { byLayout, childAttrs };
}
