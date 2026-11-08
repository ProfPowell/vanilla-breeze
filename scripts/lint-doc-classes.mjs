#!/usr/bin/env node
/**
 * lint-doc-classes — every class used in the docs and demos must exist.
 *
 * Extracts class tokens from live markup AND code samples in
 *   site/src/pages/docs/**\/*.html
 *   demos/examples/demos/*.html
 * and checks each one exists: as a class selector in src/**\/*.css, as a
 * class src/**\/*.js reads or writes, in the docs chrome stylesheet
 * demos/docs.css (doc pages only), in a <style> block of the same file, or in
 * the allowlist (scripts/lint-doc-classes.allow.txt — foreign or intentional
 * classes, each with a reason).
 *
 * Classes that were already undefined when the lint was added (2026-11-08)
 * are grandfathered in scripts/lint-doc-classes.baseline.json, keyed by file.
 * The lint fails only on uses that are not in the baseline, so the debt can
 * only shrink; --update-baseline rewrites it after a cleanup.
 *
 * A class that exists nowhere is either a typo, a class VB renamed or never
 * shipped (documentation that teaches readers to write markup that does
 * nothing), or a dead hook. All three should fail.
 *
 * What counts as a class token:
 *   - class="a b" / class='a b' attributes (also inside <code-block> samples)
 *   - class=&quot;a b&quot; in escaped samples (<pre><code>&lt;p class=…)
 *   - className = 'a b' and classList.add/toggle/remove/contains('a', 'b')
 *     in inline scripts and JS samples
 * Tokens containing template syntax (${…}, {{…}}, {%…%}) are skipped.
 *
 * Usage:
 *   node scripts/lint-doc-classes.mjs            # report, exit 1 on findings
 *   node scripts/lint-doc-classes.mjs --summary  # one line per class
 *   node scripts/lint-doc-classes.mjs <files…>   # lint only these files
 *   node scripts/lint-doc-classes.mjs --no-baseline      # show grandfathered too
 *   node scripts/lint-doc-classes.mjs --update-baseline  # rewrite the baseline
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ALLOWLIST_FILE = join(ROOT, 'scripts/lint-doc-classes.allow.txt');

/** Recursively list files under dir with one of the extensions. */
function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Remove /* … *\/ comments from CSS. */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * Class names defined by a stylesheet: `.name` in selectors (string
 * contents and url() bodies removed first, numbers like .5 ignored).
 * @param {string} css
 * @returns {Set<string>}
 */
export function cssClasses(css) {
  const clean = stripCssComments(css)
    .replace(/url\([^)]*\)/g, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
  const out = new Set();
  for (const m of clean.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) {
    // Skip things like 1.5em, 0.75rem: preceded by a digit.
    const before = clean[m.index - 1];
    if (before && /[0-9]/.test(before)) continue;
    out.add(m[1]);
  }
  return out;
}

const TEMPLATE = /\$\{|\{\{|\{%|%\}|\}\}/;

/** Split a class attribute value into tokens, dropping template syntax. */
function tokens(value) {
  if (TEMPLATE.test(value)) {
    // Keep the literal tokens around a template expression.
    value = value.replace(/\$\{[^}]*\}|\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, ' ');
  }
  return value
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && /^-?[A-Za-z_][\w-]*$/.test(t));
}

/**
 * Class tokens used in an HTML source (live markup and code samples).
 * @param {string} html
 * @returns {{ name: string, line: number }[]}
 */
export function extractClasses(html) {
  const found = [];
  const lineOf = (index) => html.slice(0, index).split('\n').length;
  const push = (value, index) => {
    for (const name of tokens(value)) found.push({ name, line: lineOf(index) });
  };
  // class="…" and class='…' (attributes, live or in raw code-block samples).
  // The (?<![\w-]) guard skips data-class=, :class= and similar.
  for (const m of html.matchAll(/(?<![\w:.-])class\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    push(m[1] ?? m[2], m.index);
  }
  // Escaped samples: class=&quot;…&quot;
  for (const m of html.matchAll(/(?<![\w:.-])class=&quot;(.*?)&quot;/g)) push(m[1], m.index);
  // Script: className = '…' / "…"
  for (const m of html.matchAll(/\.className\s*=\s*(?:'([^'\n]*)'|"([^"\n]*)")/g)) push(m[1] ?? m[2], m.index);
  // Script: classList.add('a', 'b') etc.
  for (const m of html.matchAll(/\.classList\.(?:add|remove|toggle|contains|replace)\(([^)\n]*)\)/g)) {
    for (const s of m[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) push(s[1] ?? s[2], m.index);
  }
  return found;
}

/** Classes defined in the file's own <style> blocks. */
export function localStyleClasses(html) {
  const out = new Set();
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const c of cssClasses(m[1])) out.add(c);
  }
  return out;
}

/**
 * Allowlist entries, one per line, `#` starts a comment:
 *   name               allowed everywhere (`prefix-*` wildcards allowed)
 *   path: a b c        allowed only in that repo-relative file
 * @param {string} text
 */
export function parseAllowlist(text) {
  const exact = new Set();
  const prefixes = [];
  /** @type {Map<string, Set<string>>} */
  const perFile = new Map();
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const scoped = line.match(/^(\S+\.html):\s*(.*)$/);
    if (scoped) {
      const set = perFile.get(scoped[1]) ?? new Set();
      for (const t of scoped[2].split(/\s+/).filter(Boolean)) set.add(t);
      perFile.set(scoped[1], set);
    } else if (line.endsWith('*')) prefixes.push(line.slice(0, -1));
    else exact.add(line);
  }
  return {
    has: (name, file = '') => exact.has(name)
      || prefixes.some((p) => name.startsWith(p))
      || !!perFile.get(file)?.has(name),
    files: () => [...perFile.keys()],
  };
}

/**
 * Class names VB's scripts read: classList.contains/add/toggle/remove('x'),
 * className = 'x', and '.x' inside closest/matches/querySelector(All).
 * These are real API (class="loop" on a typewriter effect) even when no
 * stylesheet mentions them.
 * @param {string} js
 * @returns {Set<string>}
 */
export function jsClasses(js) {
  const out = new Set();
  for (const m of js.matchAll(/classList\.(?:add|remove|toggle|contains|replace)\(([^)\n]*)\)/g)) {
    for (const s of m[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) for (const t of tokens(s[1] ?? s[2])) out.add(t);
  }
  for (const m of js.matchAll(/\.className\s*=\s*(?:'([^'\n]*)'|"([^"\n]*)")/g)) for (const t of tokens(m[1] ?? m[2])) out.add(t);
  for (const m of js.matchAll(/(?:closest|matches|querySelector|querySelectorAll)\(\s*(?:'([^'\n]*)'|"([^"\n]*)"|`([^`\n]*)`)/g)) {
    for (const c of cssClasses(`${m[1] ?? m[2] ?? m[3]} {}`)) out.add(c);
  }
  return out;
}

/**
 * Classes VB defines: selectors in src/**\/*.css plus classes src/**\/*.js
 * reads or writes. With { docsChrome: true } also the doc-site chrome
 * stylesheet demos/docs.css (served as /docs/docs.css on doc pages only).
 */
export function definedClasses(root = ROOT, { docsChrome = false } = {}) {
  const out = new Set();
  for (const f of walk(join(root, 'src'), ['.css'])) {
    for (const c of cssClasses(readFileSync(f, 'utf8'))) out.add(c);
  }
  for (const f of walk(join(root, 'src'), ['.js'])) {
    if (f.includes(`${join(root, 'src/vendor')}`)) continue;
    for (const c of jsClasses(readFileSync(f, 'utf8'))) out.add(c);
  }
  if (docsChrome) {
    const chrome = join(root, 'demos/docs.css');
    if (existsSync(chrome)) for (const c of cssClasses(readFileSync(chrome, 'utf8'))) out.add(c);
  }
  return out;
}

/** The files the lint covers. */
export function targetFiles(root = ROOT) {
  return [
    ...walk(join(root, 'site/src/pages/docs'), ['.html']),
    ...walk(join(root, 'demos/examples/demos'), ['.html']).filter((f) => dirname(f) === join(root, 'demos/examples/demos')),
  ].sort();
}

/**
 * Lint files; returns findings { file, line, name }.
 * @param {string[]} files
 */
export function lint(files, {
  defined = definedClasses(),
  docsDefined = definedClasses(ROOT, { docsChrome: true }),
  allow = parseAllowlist(existsSync(ALLOWLIST_FILE) ? readFileSync(ALLOWLIST_FILE, 'utf8') : ''),
} = {}) {
  const findings = [];
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(ROOT, file);
    const known = rel.startsWith('site/') ? docsDefined : defined;
    const local = localStyleClasses(html);
    for (const { name, line } of extractClasses(html)) {
      if (known.has(name) || local.has(name) || allow.has(name, rel)) continue;
      findings.push({ file: rel, line, name });
    }
  }
  return findings;
}

export const BASELINE_FILE = join(ROOT, 'scripts/lint-doc-classes.baseline.json');

/**
 * Split findings against the baseline ({ "file": ["class", …] }): the ones
 * not in it (new, fail) and the baseline pairs that no longer occur (fixed).
 * @template {{ file: string, name: string }} F
 * @param {F[]} findings
 * @param {Record<string, string[]>} baseline
 * @param {Set<string>} [checkedFiles] limit "fixed" to these files
 * @returns {{ fresh: F[], fixed: { file: string, name: string }[] }}
 */
export function applyBaseline(findings, baseline, checkedFiles) {
  const fresh = findings.filter((f) => !baseline[f.file]?.includes(f.name));
  const seen = new Set(findings.map((f) => `${f.file}\0${f.name}`));
  const fixed = [];
  for (const [file, names] of Object.entries(baseline)) {
    if (checkedFiles && !checkedFiles.has(file)) continue;
    for (const name of names) if (!seen.has(`${file}\0${name}`)) fixed.push({ file, name });
  }
  return { fresh, fixed };
}

/** Baseline object for a set of findings (sorted, stable diffs). */
export function toBaseline(findings) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const f of [...findings].sort((a, b) => a.file.localeCompare(b.file))) {
    (out[f.file] ??= []);
    if (!out[f.file].includes(f.name)) out[f.file].push(f.name);
  }
  for (const k of Object.keys(out)) out[k].sort();
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const summary = args.includes('--summary');
  const update = args.includes('--update-baseline');
  const noBaseline = args.includes('--no-baseline');
  const fileArgs = args.filter((a) => !a.startsWith('--')).map((a) => resolve(a));
  const files = fileArgs.length ? fileArgs : targetFiles();
  const all = lint(files);

  if (update) {
    if (fileArgs.length) {
      console.error('--update-baseline runs over every file; drop the file arguments.');
      process.exit(2);
    }
    writeFileSync(BASELINE_FILE, `${JSON.stringify(toBaseline(all), null, 2)}\n`);
    console.log(`lint:doc-classes: baseline written (${all.length} uses in ${new Set(all.map((f) => f.file)).size} files).`);
    process.exit(0);
  }

  const baseline = !noBaseline && existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};
  const checked = new Set(files.map((f) => relative(ROOT, f)));
  const { fresh: findings, fixed } = applyBaseline(all, baseline, checked);

  if (summary) {
    const byName = new Map();
    for (const f of findings) {
      const e = byName.get(f.name) ?? { count: 0, files: new Set() };
      e.count++; e.files.add(f.file);
      byName.set(f.name, e);
    }
    for (const [name, e] of [...byName].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`${String(e.count).padStart(4)}  ${name}  (${e.files.size} files, e.g. ${[...e.files][0]})`);
    }
  } else {
    for (const f of findings) console.log(`${f.file}:${f.line}  .${f.name} is not defined by VB (src CSS/JS, docs chrome, local <style>)`);
  }
  if (fixed.length) {
    console.log(`lint:doc-classes: ${fixed.length} baseline entr${fixed.length === 1 ? 'y is' : 'ies are'} fixed; run \`node scripts/lint-doc-classes.mjs --update-baseline\` to shrink the baseline.`);
  }
  if (findings.length) {
    console.error(`\nlint:doc-classes: ${findings.length} undefined class use(s) in ${new Set(findings.map((f) => f.file)).size} file(s) (checked ${files.length}).`);
    console.error('Fix the class, define it in src/, or add it to scripts/lint-doc-classes.allow.txt with a reason.');
    process.exit(1);
  }
  const debt = Object.values(baseline).reduce((n, names) => n + names.length, 0);
  console.log(`lint:doc-classes: ${files.length} files, no new undefined classes (${debt} grandfathered in the baseline).`);
}
