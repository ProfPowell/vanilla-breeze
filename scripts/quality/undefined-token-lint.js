/**
 * Undefined design-token lint (CI gate).
 *
 * Fails on `var(--token)` with NO fallback when --token belongs to a public
 * design-token family and is declared nowhere in src/. Such a declaration is
 * invalid at computed-value time and silently falls back to the inherited or
 * initial value — the `--color-on-primary` bug (badges and bubbles rendered
 * near-black text on primary blue) is the motivating case.
 *
 * Scope is deliberately narrow so the gate stays quiet and trustworthy:
 *   - Families: the first name segment of every custom property declared in
 *     src/tokens/*.css (core tokens, not themes) — color, size, font, radius,
 *     shadow, border, … Component hooks (--chat-*, --callout-*) and private
 *     --_* helpers are never checked: they are optional APIs by design.
 *   - Definitions: every `--name:` declaration and `@property --name` in any
 *     CSS file under src/, plus custom properties set from JS
 *     (`setProperty('--name'` / `'--name':`) under src/. A token declared
 *     ONLY by theme/pack files (src/tokens/themes/, src/packs/) counts as
 *     defined only inside those files: core CSS that reads it is broken under
 *     every other theme (that is how --color-on-primary, defined by magna
 *     alone, hid).
 *   - References with a fallback (`var(--x, …)`) are reported as warnings
 *     (exit code unaffected) for the core scales only (WARN_FAMILIES): often
 *     a typo hidden by the fallback. Component hooks that merely share a
 *     family name (--page-tools-*, --status-gap) stay quiet.
 *   - A line containing `undefined-token-ok` is skipped.
 *
 * Usage:  node scripts/quality/undefined-token-lint.js
 * Exit:   0 clean, 1 if any no-fallback reference is undefined
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

/**
 * Replace block comments with same-length whitespace (keeps line numbers).
 * @param {string} css
 * @returns {string}
 */
export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Custom properties declared in CSS text (`--x:` and `@property --x`).
 * @param {string} css
 * @returns {Set<string>}
 */
export function declaredIn(css) {
  const out = new Set();
  const text = stripComments(css);
  for (const m of text.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)) out.add(m[1]);
  for (const m of text.matchAll(/@property\s+(--[\w-]+)/g)) out.add(m[1]);
  return out;
}

/**
 * Custom properties a JS source sets (setProperty or style-object keys).
 * @param {string} js
 * @returns {Set<string>}
 */
export function declaredInJs(js) {
  const out = new Set();
  for (const m of js.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) out.add(m[1]);
  for (const m of js.matchAll(/['"`](--[\w-]+)['"`]\s*:/g)) out.add(m[1]);
  return out;
}

/**
 * Family of a token: `--color-text-muted` → `color`. Private `--_x` → null.
 * @param {string} token
 * @returns {string|null}
 */
export function familyOf(token) {
  if (token.startsWith('--_')) return null;
  const m = /^--([a-z0-9]+)/i.exec(token);
  return m ? m[1].toLowerCase() : null;
}

/**
 * var() references in CSS text.
 * @returns {{ token: string, line: number, hasFallback: boolean, text: string }[]}
 */
export function references(css) {
  const out = [];
  const raw = css.split('\n');
  const lines = stripComments(css).split('\n');
  lines.forEach((line, i) => {
    if (raw[i].includes('undefined-token-ok')) return;
    for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
      out.push({ token: m[1], line: i + 1, hasFallback: m[2] === ',', text: raw[i].trim() });
    }
  });
  return out;
}

/** Core scales whose fallback-protected misses are worth a warning. */
export const WARN_FAMILIES = new Set([
  'color', 'font', 'size', 'radius', 'shadow', 'border', 'ease', 'duration',
  'focus', 'motion', 'z', 'line', 'letter',
]);

/**
 * Theme and pack CSS: their private vocabulary is valid only inside them.
 * @param {string} file
 * @returns {boolean}
 */
export function isThemeFile(file) {
  return /(^|\/)src\/(tokens\/themes|packs)\//.test(file);
}

/**
 * Core lint over in-memory sources (pure; used by the unit test).
 * @param {{ tokenCss: string[], css: { file: string, text: string }[], js?: string[] }} input
 * @returns {{ errors: object[], warnings: object[] }}
 */
export function lintTokens({ tokenCss, css, js = [] }) {
  const families = new Set();
  for (const text of tokenCss) {
    for (const t of declaredIn(text)) {
      const f = familyOf(t);
      if (f) families.add(f);
    }
  }
  const defined = new Set();
  const themeOnly = new Set();
  for (const text of tokenCss) for (const t of declaredIn(text)) defined.add(t);
  for (const { file, text } of css) {
    for (const t of declaredIn(text)) (isThemeFile(file) ? themeOnly : defined).add(t);
  }
  for (const text of js) for (const t of declaredInJs(text)) defined.add(t);

  const errors = [];
  const warnings = [];
  for (const { file, text } of css) {
    for (const ref of references(text)) {
      const fam = familyOf(ref.token);
      if (!fam || !families.has(fam) || defined.has(ref.token)) continue;
      if (themeOnly.has(ref.token) && isThemeFile(file)) continue;
      if (!ref.hasFallback) errors.push({ file, ...ref });
      else if (WARN_FAMILIES.has(fam)) warnings.push({ file, ...ref });
    }
  }
  return { errors, warnings };
}

function walk(dir, exts, skip = []) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (skip.some((s) => p.includes(s))) continue;
    if (e.isDirectory()) out.push(...walk(p, exts, skip));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

function main() {
  const SRC = join(ROOT, 'src');
  const skip = [`${SRC}/vendor`];
  const tokenFiles = readdirSync(join(SRC, 'tokens'))
    .filter((n) => n.endsWith('.css'))
    .map((n) => join(SRC, 'tokens', n));
  const cssFiles = walk(SRC, ['.css'], skip);
  const jsFiles = walk(SRC, ['.js'], skip);

  const { errors, warnings } = lintTokens({
    tokenCss: tokenFiles.map((f) => readFileSync(f, 'utf8')),
    css: cssFiles.map((f) => ({ file: relative(ROOT, f), text: readFileSync(f, 'utf8') })),
    js: jsFiles.map((f) => readFileSync(f, 'utf8')),
  });

  const show = (list) => list.forEach((r) => console.log(`  ${r.file}:${r.line}  ${r.token}\n      ${r.text}`));
  if (warnings.length) {
    console.log(`Undefined design tokens behind a fallback (warning, ${warnings.length}):`);
    show(warnings);
  }
  if (errors.length) {
    console.error(`\nUndefined design tokens with no fallback (${errors.length}):`);
    show(errors);
    console.error('\nDeclare the token in src/tokens/, fix the name, or add a fallback.');
    process.exit(1);
  }
  console.log(`undefined-token-lint: ${cssFiles.length} CSS files clean (${warnings.length} fallback warning(s)).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
