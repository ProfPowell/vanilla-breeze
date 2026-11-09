#!/usr/bin/env node
/**
 * lint-doc-classes — every class used in the docs and demos must exist.
 *
 * Scanned files:
 *   site/src/pages/docs/**\/*.html
 *   demos/examples/demos/*.html
 *   demos/patterns/demos/*.html
 *   demos/snippets/demos/**\/*.html
 *
 * Each file is split into LIVE markup and SAMPLES. A sample is the body of a
 * <code-block> or a <pre>; everything else is live. Class tokens are
 * extracted from both and each use must be defined by one of:
 *
 *   1. VB itself (the global set, see "What VB defines" below);
 *   2. the docs chrome stylesheet demos/docs.css (doc pages only);
 *   3. the file's own CSS, split by where it lives:
 *        - a live <style> block defines classes for LIVE uses only;
 *        - a CSS sample (<code-block language="css">, <pre><code
 *          class="language-css">) or a <style> inside an HTML sample defines
 *          classes for SAMPLE uses only.
 *      (A page's demo CSS does not make a sample's class real for a reader
 *      who copies the sample, and a sample's CSS is not loaded on the page.)
 *      Demos are isolated pages: their own <style> is live CSS.
 *   4. the file's own hooks, for live and sample uses alike:
 *        - classes its <script> blocks or JS samples (language="js" /
 *          "javascript") read or write: classList.*('x'), className = 'x',
 *          and '.x' in closest/matches/querySelector(All) strings;
 *        - `.x` tokens in a data-* attribute whose value parses as a CSS
 *          selector (data-select-all=".row-select"; filenames and domains
 *          such as "logo.svg" or "example.com" are not selectors).
 *   5. the allowlist (scripts/lint-doc-classes.allow.txt), each entry with a
 *      reason.
 * Sample text is HTML-unescaped (&lt; &gt; &quot; &#39; &amp;) before its CSS
 * and JS are read.
 *
 * What VB defines (the global set):
 *   - class selectors in src/**\/*.css and classes src/**\/*.js reads or
 *     writes (as above), EXCEPT src/tokens/themes/** and src/packs/**: a class
 *     only a theme or a pack styles is not VB API;
 *   - a CSS class counts only where it is not scoped: it must appear in a
 *     selector compound that has no ancestor compound naming a custom element
 *     or a different class. `.badge` defined only as `nav-bar .badge`, or
 *     `.text-muted` only as `tool-tip > pop-over.hover-card .text-muted`, is
 *     that component's internals, not a class authors can use on their own.
 *     Nesting is resolved first (`.card { & .title {} }` scopes .title);
 *     element, attribute and :root/:where([data-…]) ancestors do not scope;
 *     classes inside :not(…) do not scope; compound-mates do not scope
 *     (`.button.small` defines .small).
 *     A scoped class still counts in a file that uses its whole scope (every
 *     custom element as a `<tag`, every scoping class as a class use), so
 *     `<drop-down>…<button class="danger">` passes while a lone
 *     `<button class="danger">` elsewhere fails. This is file-level, not DOM
 *     ancestry: deliberately simple. Measured 2026-11-08: the rule adds 23-27
 *     file/class pairs (mostly text-muted and danger, plus section, message,
 *     settings-section) over counting every scoped selector as defined.
 *   - Pack classes (src/packs/<name>/**) count in a file that loads that pack
 *     (any `packs/<name>/` or `packs/<name>.` path in it) and on the pack's
 *     own page, site/src/pages/docs/packs/<name>.html.
 *   (JS-derived classes are never scoped.)
 *
 * Page-local style checks (docs pages only, site/src/pages/docs/**): a class
 * that is the subject of an unscoped rule in a LIVE <style> block
 * (`.foo {}`, `p.foo {}`, not `.hero .foo {}`) is reported when
 *   - dup:    the same class is also defined that way in another docs page's
 *             live <style> (shared page CSS belongs in demos/docs.css), or
 *   - shadow: it restyles a class demos/docs.css or src CSS (themes and packs
 *             excluded) already defines, anywhere in a selector.
 * Descendant-context reuse (`.kitchen-sink-hero .lead {}`) is allowed.
 * These findings fail the lint like undefined classes. In the baseline and
 * the allowlist they are keyed `dup:name` / `shadow:name`.
 *
 * What counts as a class token (a "use"):
 *   - class="a b" / class='a b' attributes (also inside <code-block> samples)
 *   - class=&quot;a b&quot; in escaped samples (<pre><code>&lt;p class=…)
 *   - className = 'a b' and classList.add/toggle/remove/contains('a', 'b')
 *     in inline scripts and JS samples
 * Tokens containing template syntax (${…}, {{…}}, {%…%}) are skipped.
 *
 * Classes that were already undefined when the lint was added (2026-11-08)
 * are grandfathered in scripts/lint-doc-classes.baseline.json, keyed by file.
 * The lint fails only on findings that are not in the baseline, so the debt
 * can only shrink; --update-baseline rewrites it after a cleanup.
 *
 * A class that exists nowhere is either a typo, a class VB renamed or never
 * shipped (documentation that teaches readers to write markup that does
 * nothing), or a dead hook. All three should fail.
 *
 * Usage:
 *   node scripts/lint-doc-classes.mjs            # report, exit 1 on findings
 *   node scripts/lint-doc-classes.mjs --summary  # one line per class
 *   node scripts/lint-doc-classes.mjs <files…>   # lint only these files
 *   node scripts/lint-doc-classes.mjs --no-baseline      # show grandfathered too
 *   node scripts/lint-doc-classes.mjs --update-baseline  # rewrite the baseline
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ALLOWLIST_FILE = join(ROOT, 'scripts/lint-doc-classes.allow.txt');

/**
 * Recursively list files under dir with one of the extensions.
 * @param {string} dir
 * @param {string[]} exts
 * @param {string[]} [out]
 * @returns {string[]}
 */
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

/**
 * Remove /* … *\/ comments from CSS.
 * @param {string} css
 */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * CSS with comments removed and string contents and url() bodies emptied,
 * keeping offsets (each removed character becomes a space).
 * @param {string} css
 */
function cleanCss(css) {
  const blank = (/** @type {string} */ m) => m.replace(/[^\n]/g, ' ');
  return css
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/url\([^)]*\)/g, blank)
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => `"${blank(m.slice(2))}"`);
}

/** `.name` class tokens, skipping decimals like 1.5em. */
const CLASS_TOKEN = /\.(-?[A-Za-z_][\w-]*)/g;

/**
 * Is the `.` at index the decimal point of a number (1.5em, 0.75rem) rather
 * than a class (h1.title, button.small)?
 * @param {string} text
 * @param {number} index
 */
function isDecimal(text, index) {
  return /(?:^|[^\w-])\d+$/.test(text.slice(Math.max(0, index - 20), index));
}

/**
 * Class names in a CSS/selector text (decimals ignored).
 * @param {string} text already cleaned
 * @returns {string[]}
 */
function classTokens(text) {
  const out = [];
  for (const m of text.matchAll(CLASS_TOKEN)) {
    if (isDecimal(text, m.index ?? 0)) continue;
    out.push(m[1]);
  }
  return out;
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
  for (const m of clean.matchAll(CLASS_TOKEN)) {
    // Skip things like 1.5em, 0.75rem (but not h1.title).
    if (isDecimal(clean, m.index ?? 0)) continue;
    out.add(m[1]);
  }
  return out;
}

/**
 * Split at top-level commas (outside parentheses and brackets).
 * @param {string} s
 * @returns {string[]}
 */
function splitList(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

/**
 * Split a complex selector into compounds at top-level combinators.
 * @param {string} sel
 * @returns {string[]}
 */
function compounds(sel) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[\s>+~]/.test(ch)) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Remove the arguments of :not(…), which never scope. */
function dropNot(/** @type {string} */ compound) {
  let out = compound;
  for (;;) {
    const i = out.indexOf(':not(');
    if (i < 0) return out;
    let depth = 0;
    let j = i + 4;
    for (; j < out.length; j++) {
      if (out[j] === '(') depth++;
      else if (out[j] === ')' && --depth === 0) break;
    }
    out = out.slice(0, i) + out.slice(j + 1);
  }
}

const CUSTOM_ELEMENT = /(?:^|[\s(,])([a-z][a-z0-9]*-[\w-]*)/g;

/**
 * Class occurrences in one flat complex selector.
 * `scope`: the custom elements (`nav-bar`) and other classes (`.card`) named
 * by earlier compounds (:not() arguments ignored); `free` when it is empty.
 * `subject`: the class is in the last (subject) compound.
 * @param {string} sel
 * @returns {{ name: string, free: boolean, subject: boolean, scope: string[] }[]}
 */
export function selectorClasses(sel) {
  const parts = compounds(sel.replace(/\[[^\]]*\]/g, '[]'));
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    for (const name of classTokens(parts[i])) {
      /** @type {Set<string>} */
      const scope = new Set();
      for (const p of parts.slice(0, i)) {
        const q = dropNot(p);
        for (const m of q.matchAll(CUSTOM_ELEMENT)) scope.add(m[1]);
        for (const c of classTokens(q)) if (c !== name) scope.add(`.${c}`);
      }
      out.push({ name, free: scope.size === 0, subject: i === parts.length - 1, scope: [...scope] });
    }
  }
  return out;
}

/**
 * Every class occurrence in a stylesheet, with nesting and @scope resolved.
 * @param {string} css
 * @returns {{ name: string, free: boolean, subject: boolean, scope: string[], index: number }[]}
 */
export function cssClassDefs(css) {
  const text = cleanCss(css);
  const out = [];
  /** @type {(string[] | null)[]} parent selector lists; null = not a style rule */
  const stack = [];
  let preludeStart = 0;
  /** Nearest enclosing style-rule selector list. */
  const parentList = () => {
    for (let k = stack.length - 1; k >= 0; k--) if (stack[k]) return stack[k];
    return null;
  };
  /**
   * @param {string[]} list
   * @param {string[] | null} parents
   */
  const resolveList = (list, parents) => {
    if (!parents) return list;
    const res = [];
    for (const s of list) {
      for (const p of parents) res.push(s.includes('&') ? s.replaceAll('&', p) : `${p} ${s}`);
      if (res.length > 2000) break;
    }
    return [...new Set(res)];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ';') { preludeStart = i + 1; continue; }
    if (ch === '}') { stack.pop(); preludeStart = i + 1; continue; }
    if (ch !== '{') continue;
    const prelude = text.slice(preludeStart, i).trim();
    const at = preludeStart + (text.slice(preludeStart, i).length - text.slice(preludeStart, i).trimStart().length);
    preludeStart = i + 1;
    if (prelude.startsWith('@')) {
      const scope = prelude.match(/^@scope\s*\(([^)]*)\)/);
      if (scope) {
        const list = resolveList(splitList(scope[1]), parentList());
        for (const sel of list) for (const c of selectorClasses(sel)) out.push({ ...c, subject: false, index: at });
        stack.push(list);
      } else stack.push(null);
      continue;
    }
    // A declaration whose value holds a block (rare) or a keyframe selector.
    if (/^[\d%]|^(from|to)\b/.test(prelude) || /^--/.test(prelude)) { stack.push(null); continue; }
    const list = resolveList(splitList(prelude), parentList());
    for (const sel of list) for (const c of selectorClasses(sel)) out.push({ ...c, index: at });
    stack.push(list);
  }
  return out;
}

/**
 * Unscoped class names of a stylesheet (see the header: what VB defines).
 * @param {string} css
 * @returns {Set<string>}
 */
export function freeCssClasses(css) {
  return new Set(cssClassDefs(css).filter((d) => d.free).map((d) => d.name));
}

const TEMPLATE = /\$\{|\{\{|\{%|%\}|\}\}/;

/**
 * Split a class attribute value into tokens, dropping template syntax.
 * @param {string} value
 * @returns {string[]}
 */
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
 * Class uses with their offsets.
 * @param {string} html
 * @returns {{ name: string, line: number, index: number }[]}
 */
function extractUses(html) {
  const found = [];
  const lineOf = (/** @type {number} */ index) => html.slice(0, index).split('\n').length;
  const push = (/** @type {string} */ value, /** @type {number} */ index) => {
    for (const name of tokens(value)) found.push({ name, line: lineOf(index), index });
  };
  // class="…" and class='…' (attributes, live or in raw code-block samples).
  // The (?<![\w-]) guard skips data-class=, :class= and similar.
  for (const m of html.matchAll(/(?<![\w:.-])class\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    push(m[1] ?? m[2], m.index ?? 0);
  }
  // Escaped samples: class=&quot;…&quot;
  for (const m of html.matchAll(/(?<![\w:.-])class=&quot;(.*?)&quot;/g)) push(m[1], m.index ?? 0);
  // Script: className = '…' / "…"
  for (const m of html.matchAll(/\.className\s*=\s*(?:'([^'\n]*)'|"([^"\n]*)")/g)) push(m[1] ?? m[2], m.index ?? 0);
  // Script: classList.add('a', 'b') etc.
  for (const m of html.matchAll(/\.classList\.(?:add|remove|toggle|contains|replace)\(([^)\n]*)\)/g)) {
    for (const s of m[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) push(s[1] ?? s[2], m.index ?? 0);
  }
  return found.sort((a, b) => a.index - b.index);
}

/**
 * Class tokens used in an HTML source (live markup and code samples).
 * @param {string} html
 * @returns {{ name: string, line: number }[]}
 */
export function extractClasses(html) {
  return extractUses(html).map(({ name, line }) => ({ name, line }));
}

/**
 * Undo HTML escaping in a sample.
 * @param {string} s
 */
export function unescapeHtml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Sample regions of an HTML file: <code-block> bodies and <pre> bodies not
 * already inside a code-block. `lang` is the code-block language or the
 * language-x class of a <pre><code>.
 * @param {string} html
 * @returns {{ start: number, end: number, lang: string, body: string }[]}
 */
export function sampleRegions(html) {
  /** @type {{ start: number, end: number, lang: string, body: string }[]} */
  const out = [];
  for (const m of html.matchAll(/<code-block\b([^>]*)>([\s\S]*?)<\/code-block>/g)) {
    const start = (m.index ?? 0) + m[0].indexOf('>') + 1;
    out.push({ start, end: start + m[2].length, lang: m[1].match(/\blanguage\s*=\s*["']?([\w-]+)/)?.[1] ?? '', body: m[2] });
  }
  const inside = (/** @type {number} */ i) => out.some((r) => i >= r.start && i < r.end);
  for (const m of html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)) {
    if (inside(m.index ?? 0)) continue;
    const start = (m.index ?? 0) + m[0].indexOf('>') + 1;
    let body = m[1];
    const code = body.match(/^\s*<code\b([^>]*)>/);
    const lang = code?.[1].match(/language-([\w-]+)/)?.[1] ?? '';
    out.push({ start, end: start + m[1].length, lang, body });
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Blank out the given regions (keeps offsets and line numbers).
 * @param {string} html
 * @param {{ start: number, end: number }[]} regions
 */
function maskRegions(html, regions) {
  let out = '';
  let pos = 0;
  for (const r of regions) {
    out += html.slice(pos, r.start) + html.slice(r.start, r.end).replace(/[^\n]/g, ' ');
    pos = r.end;
  }
  return out + html.slice(pos);
}

/**
 * Bodies of <tag>…</tag> blocks.
 * @param {string} html
 * @param {'style' | 'script'} tag
 * @returns {{ body: string, index: number }[]}
 */
function blocks(html, tag) {
  const re = tag === 'style' ? /<style\b[^>]*>([\s\S]*?)<\/style>/gi : /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  return [...html.matchAll(re)].map((m) => ({ body: m[1], index: (m.index ?? 0) + m[0].indexOf('>') + 1 }));
}

/**
 * Classes defined in the file's own <style> blocks (live or sample).
 * @param {string} html
 */
export function localStyleClasses(html) {
  const out = new Set();
  for (const { body } of blocks(html, 'style')) for (const c of cssClasses(body)) out.add(c);
  return out;
}

const NOT_A_CLASS = /^(html?|css|m?js|json|png|jpe?g|gif|svg|webp|avif|ico|md|txt|pdf|xml|mp[34]|webm|woff2?|com|org|net|io|dev|test|app|edu|gov)$/i;

/**
 * Class names in a data-* attribute value that parses as a CSS selector
 * list (".row-select", "input.pick, li > .item"). Values that look like
 * filenames or domains ("logo.svg", "example.com") are not selectors.
 * @param {string} value
 * @returns {string[]}
 */
export function selectorValueClasses(value) {
  const v = value.trim();
  if (!v.includes('.')) return [];
  const flat = v.replace(/\[[^\]]*\]/g, '[]').replace(/\(([^()]*)\)/g, '()');
  const compound = /^(?:[A-Za-z][\w-]*|\*)?(?:\.-?[A-Za-z_][\w-]*|#-?[A-Za-z_][\w-]*|\[\]|::?[\w-]+(?:\(\))?)*$/;
  for (const sel of flat.split(',')) {
    const parts = sel.trim().split(/\s*[>+~]\s*|\s+/).filter(Boolean);
    if (!parts.length || !parts.every((p) => compound.test(p))) return [];
  }
  const names = classTokens(v);
  if (!names.length || names.some((n) => NOT_A_CLASS.test(n))) return [];
  return names;
}

/**
 * Classes named by selector-valued data-* attributes in an HTML source
 * (raw or &quot;-escaped).
 * @param {string} html
 * @returns {Set<string>}
 */
export function selectorAttrClasses(html) {
  const out = new Set();
  for (const m of html.matchAll(/(?<![\w-])data-[\w-]+\s*=\s*(?:"([^"]*)"|'([^']*)'|&quot;(.*?)&quot;)/g)) {
    for (const c of selectorValueClasses(unescapeHtml(m[1] ?? m[2] ?? m[3]))) out.add(c);
  }
  return out;
}

/**
 * Per-file analysis: class uses (live or sample) and what the file itself
 * defines for each (see the header).
 * @param {string} html
 */
export function analyzeFile(html) {
  const regions = sampleRegions(html);
  const live = maskRegions(html, regions);
  const inSample = (/** @type {number} */ i) => regions.some((r) => i >= r.start && i < r.end);

  /** @type {Set<string>} */ const liveCss = new Set();
  /** @type {Set<string>} */ const sampleCss = new Set();
  /** @type {Set<string>} */ const hooks = new Set();
  /** @type {{ css: string, index: number }[]} */ const liveStyles = [];

  for (const { body, index } of blocks(live, 'style')) {
    liveStyles.push({ css: body, index });
    for (const c of cssClasses(body)) liveCss.add(c);
  }
  for (const { body } of blocks(live, 'script')) for (const c of jsClasses(body)) hooks.add(c);
  for (const r of regions) {
    const text = unescapeHtml(r.body.replace(/^\s*<code\b[^>]*>|<\/code>\s*$/g, ''));
    if (r.lang === 'css') for (const c of cssClasses(text)) sampleCss.add(c);
    if (r.lang === 'js' || r.lang === 'javascript') for (const c of jsClasses(text)) hooks.add(c);
    for (const { body } of blocks(text, 'style')) for (const c of cssClasses(body)) sampleCss.add(c);
    for (const { body } of blocks(text, 'script')) for (const c of jsClasses(body)) hooks.add(c);
  }
  for (const c of selectorAttrClasses(html)) hooks.add(c);

  const uses = extractUses(html).map((u) => ({ ...u, sample: inSample(u.index) }));
  return { uses, liveCss, sampleCss, hooks, liveStyles };
}

/**
 * Allowlist entries, one per line, `#` starts a comment:
 *   name               allowed everywhere (`prefix-*` wildcards allowed)
 *   path: a b c        allowed only in that repo-relative file
 * Page-local style findings are keyed `dup:name` / `shadow:name`.
 * @param {string} text
 */
export function parseAllowlist(text) {
  const exact = new Set();
  /** @type {string[]} */
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
    has: (/** @type {string} */ name, file = '') => exact.has(name)
      || prefixes.some((p) => name.startsWith(p))
      || !!perFile.get(file)?.has(name),
    files: () => [...perFile.keys()],
  };
}

/**
 * Class names a script reads or writes: classList.contains/add/toggle/
 * remove('x'), className = 'x', and '.x' inside closest/matches/
 * querySelector(All). These are real API (class="loop" on a typewriter
 * effect) even when no stylesheet mentions them.
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
 * src files that count as VB API: not themes, packs or vendored code.
 * @param {string} root
 * @param {string[]} exts
 */
function apiSourceFiles(root, exts) {
  const skip = ['src/tokens/themes', 'src/packs', 'src/vendor'].map((d) => join(root, d) + sep);
  return walk(join(root, 'src'), exts).filter((f) => !skip.some((d) => f.startsWith(d)));
}

/**
 * Classes VB defines: unscoped class selectors in src/**\/*.css plus classes
 * src/**\/*.js reads or writes, excluding themes and packs. With
 * { docsChrome: true } also the doc-site chrome stylesheet demos/docs.css
 * (served as /docs/docs.css on doc pages only).
 * @param {string} [root]
 * @param {{ docsChrome?: boolean, scoped?: boolean }} [opts] scoped: true
 *   also counts scoped class selectors (the pre-2026-11-08 rule)
 */
export function definedClasses(root = ROOT, { docsChrome = false, scoped = false } = {}) {
  const out = new Set();
  const fromCss = (/** @type {string} */ css) => (scoped ? cssClasses(css) : freeCssClasses(css));
  for (const f of apiSourceFiles(root, ['.css'])) for (const c of fromCss(readFileSync(f, 'utf8'))) out.add(c);
  for (const f of apiSourceFiles(root, ['.js'])) for (const c of jsClasses(readFileSync(f, 'utf8'))) out.add(c);
  if (docsChrome) {
    const chrome = join(root, 'demos/docs.css');
    if (existsSync(chrome)) for (const c of fromCss(readFileSync(chrome, 'utf8'))) out.add(c);
  }
  return out;
}

/**
 * Every class a shared stylesheet mentions (scoped or not): what a docs
 * page's own rule would collide with. demos/docs.css plus API src CSS.
 * @param {string} [root]
 */
export function sharedCssClasses(root = ROOT) {
  const out = new Set();
  const files = [...apiSourceFiles(root, ['.css']), join(root, 'demos/docs.css')];
  for (const f of files) if (existsSync(f)) for (const c of cssClasses(readFileSync(f, 'utf8'))) out.add(c);
  return out;
}

/**
 * Scoped class definitions: class → the scopes it is styled under (each a
 * list of custom element names and `.class` tokens), from API src CSS and,
 * with { docsChrome: true }, demos/docs.css. A scoped class counts as
 * defined on a page that uses every element and class of one of its scopes.
 * @param {string} [root]
 * @param {{ docsChrome?: boolean }} [opts]
 * @returns {Map<string, string[][]>}
 */
export function scopedClasses(root = ROOT, { docsChrome = false } = {}) {
  /** @type {Map<string, string[][]>} */
  const out = new Map();
  const files = apiSourceFiles(root, ['.css']);
  if (docsChrome) files.push(join(root, 'demos/docs.css'));
  for (const f of files) {
    if (!existsSync(f)) continue;
    for (const d of cssClassDefs(readFileSync(f, 'utf8'))) {
      if (d.free) continue;
      const list = out.get(d.name) ?? [];
      const key = d.scope.join(' ');
      if (!list.some((s) => s.join(' ') === key)) list.push(d.scope);
      out.set(d.name, list);
    }
  }
  return out;
}

/**
 * Does the file use this scope token: a custom element (`<nav-bar`, also
 * escaped) or a class (`.card`: any class use or hook in the file)?
 * @param {string} token
 * @param {string} html
 * @param {Set<string>} classesInFile
 */
function fileHasScope(token, html, classesInFile) {
  if (token.startsWith('.')) return classesInFile.has(token.slice(1));
  return new RegExp(`(?:<|&lt;)${token}(?![\\w-])`).test(html);
}

/**
 * Classes each pack defines (CSS and JS under src/packs/<name>/), by pack
 * name. Pack classes are not VB API, but a page that loads the pack (or is
 * the pack's own docs page) may use them.
 * @param {string} [root]
 * @returns {Map<string, Set<string>>}
 */
export function packClasses(root = ROOT) {
  /** @type {Map<string, Set<string>>} */
  const out = new Map();
  const dir = join(root, 'src/packs');
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    const set = new Set();
    for (const f of walk(full, ['.css'])) for (const c of cssClasses(readFileSync(f, 'utf8'))) set.add(c);
    for (const f of walk(full, ['.js'])) for (const c of jsClasses(readFileSync(f, 'utf8'))) set.add(c);
    out.set(name, set);
  }
  return out;
}

/**
 * Packs a file loads or documents: any `packs/<name>/` or `packs/<name>.`
 * path in it (a stylesheet or script link), and the pack docs page itself
 * (site/src/pages/docs/packs/<name>.html).
 * @param {string} rel repo-relative path
 * @param {string} html
 * @returns {Set<string>}
 */
export function packsUsed(rel, html) {
  const out = new Set([...html.matchAll(/packs\/([\w-]+)[/.]/g)].map((m) => m[1]));
  const own = rel.match(/^site\/src\/pages\/docs\/packs\/([\w-]+)\.html$/);
  if (own) out.add(own[1]);
  return out;
}

/** The docs pages directory, relative to the repo. */
const DOCS_DIR = 'site/src/pages/docs/';

/**
 * The files the lint covers.
 * @param {string} [root]
 */
export function targetFiles(root = ROOT) {
  const top = (/** @type {string} */ d) => walk(join(root, d), ['.html']).filter((f) => dirname(f) === join(root, d));
  return [
    ...walk(join(root, 'site/src/pages/docs'), ['.html']),
    ...top('demos/examples/demos'),
    ...top('demos/patterns/demos'),
    ...walk(join(root, 'demos/snippets/demos'), ['.html']),
  ].sort();
}

/**
 * Subject classes of unscoped rules in a page's live <style> blocks, with
 * the offset of their rule.
 * @param {{ css: string, index: number }[]} liveStyles
 * @returns {Map<string, number>} name → offset in the file
 */
export function pageLocalClasses(liveStyles) {
  /** @type {Map<string, number>} */
  const out = new Map();
  for (const { css, index } of liveStyles) {
    for (const d of cssClassDefs(css)) {
      if (d.free && d.subject && !out.has(d.name)) out.set(d.name, index + d.index);
    }
  }
  return out;
}

/**
 * @typedef {{ file: string, line: number, name: string, kind?: 'undefined' | 'dup' | 'shadow', detail?: string }} Finding
 */

/**
 * Baseline/allowlist key of a finding: the class name, or `kind:name` for
 * page-local style findings.
 * @param {{ name: string, kind?: string }} f
 */
export function findingKey(f) {
  return !f.kind || f.kind === 'undefined' ? f.name : `${f.kind}:${f.name}`;
}

/**
 * Lint files; returns findings { file, line, name, kind }.
 * @param {string[]} files absolute paths
 * @param {{
 *   root?: string,
 *   defined?: Set<string>,
 *   docsDefined?: Set<string>,
 *   scoped?: Map<string, string[][]>,
 *   docsScoped?: Map<string, string[][]>,
 *   packs?: Map<string, Set<string>>,
 *   shared?: Set<string>,
 *   docsPages?: string[],
 *   allow?: ReturnType<typeof parseAllowlist>,
 * }} [opts] docsPages: every docs page, for the cross-page duplicate check
 * @returns {Finding[]}
 */
export function lint(files, {
  root = ROOT,
  defined = definedClasses(root),
  docsDefined = definedClasses(root, { docsChrome: true }),
  scoped = scopedClasses(root),
  docsScoped = scopedClasses(root, { docsChrome: true }),
  packs = packClasses(root),
  shared = sharedCssClasses(root),
  docsPages = targetFiles(root).filter((f) => relative(root, f).startsWith(DOCS_DIR)),
  allow = parseAllowlist(existsSync(ALLOWLIST_FILE) ? readFileSync(ALLOWLIST_FILE, 'utf8') : ''),
} = {}) {
  /** @type {Finding[]} */
  const findings = [];
  /** @type {Map<string, ReturnType<typeof analyzeFile> & { html: string }>} */
  const cache = new Map();
  const analyze = (/** @type {string} */ file) => {
    let a = cache.get(file);
    if (!a) {
      const html = readFileSync(file, 'utf8');
      a = { ...analyzeFile(html), html };
      cache.set(file, a);
    }
    return a;
  };

  // Cross-page index of page-local classes on docs pages.
  /** @type {Map<string, string[]>} class → files */
  const pageLocalIndex = new Map();
  for (const file of new Set([...docsPages, ...files])) {
    if (!relative(root, file).startsWith(DOCS_DIR) || !existsSync(file)) continue;
    for (const name of pageLocalClasses(analyze(file).liveStyles).keys()) {
      const list = pageLocalIndex.get(name) ?? [];
      list.push(relative(root, file));
      pageLocalIndex.set(name, list);
    }
  }

  for (const file of files) {
    const a = analyze(file);
    const rel = relative(root, file);
    const isDocs = rel.startsWith(DOCS_DIR);
    const known = isDocs ? docsDefined : defined;
    const knownScoped = isDocs ? docsScoped : scoped;
    const classesInFile = new Set([...a.uses.map((u) => u.name), ...a.hooks]);
    const packDefined = [...packsUsed(rel, a.html)].map((p) => packs.get(p) ?? new Set());
    /** @type {Finding[]} */
    const fileFindings = [];
    for (const { name, line, sample } of a.uses) {
      if (known.has(name) || a.hooks.has(name) || allow.has(name, rel)) continue;
      if (sample ? a.sampleCss.has(name) : a.liveCss.has(name)) continue;
      if (packDefined.some((set) => set.has(name))) continue;
      if (knownScoped.get(name)?.some((scope) => scope.every((t) => fileHasScope(t, a.html, classesInFile)))) continue;
      fileFindings.push({ file: rel, line, name, kind: 'undefined' });
    }
    if (isDocs) {
      const lineOf = (/** @type {number} */ i) => a.html.slice(0, i).split('\n').length;
      for (const [name, index] of pageLocalClasses(a.liveStyles)) {
        const others = (pageLocalIndex.get(name) ?? []).filter((f) => f !== rel);
        if (others.length && !allow.has(`dup:${name}`, rel)) {
          fileFindings.push({ file: rel, line: lineOf(index), name, kind: 'dup', detail: others.join(', ') });
        }
        if (shared.has(name) && !allow.has(`shadow:${name}`, rel)) {
          fileFindings.push({ file: rel, line: lineOf(index), name, kind: 'shadow' });
        }
      }
    }
    findings.push(...fileFindings.sort((x, y) => x.line - y.line));
  }
  return findings;
}

export const BASELINE_FILE = join(ROOT, 'scripts/lint-doc-classes.baseline.json');

/**
 * Split findings against the baseline ({ "file": ["class" | "kind:class", …] }):
 * the ones not in it (new, fail) and the baseline pairs that no longer occur
 * (fixed).
 * @template {{ file: string, name: string, kind?: string }} F
 * @param {F[]} findings
 * @param {Record<string, string[]>} baseline
 * @param {Set<string>} [checkedFiles] limit "fixed" to these files
 * @returns {{ fresh: F[], fixed: { file: string, name: string }[] }}
 */
export function applyBaseline(findings, baseline, checkedFiles) {
  const fresh = findings.filter((f) => !baseline[f.file]?.includes(findingKey(f)));
  const seen = new Set(findings.map((f) => `${f.file}\0${findingKey(f)}`));
  const fixed = [];
  for (const [file, names] of Object.entries(baseline)) {
    if (checkedFiles && !checkedFiles.has(file)) continue;
    for (const name of names) if (!seen.has(`${file}\0${name}`)) fixed.push({ file, name });
  }
  return { fresh, fixed };
}

/**
 * Baseline object for a set of findings (sorted, stable diffs).
 * @param {{ file: string, name: string, kind?: string }[]} findings
 */
export function toBaseline(findings) {
  /** @type {Record<string, string[]>} */
  const out = {};
  for (const f of [...findings].sort((a, b) => a.file.localeCompare(b.file))) {
    (out[f.file] ??= []);
    const key = findingKey(f);
    if (!out[f.file].includes(key)) out[f.file].push(key);
  }
  for (const k of Object.keys(out)) out[k].sort();
  return out;
}

/** @param {Finding} f */
function describe(f) {
  if (f.kind === 'dup') return `.${f.name} is page-local CSS also defined on ${f.detail} (move it to demos/docs.css)`;
  if (f.kind === 'shadow') return `.${f.name} in this page's <style> restyles a class demos/docs.css or src CSS defines`;
  return `.${f.name} is not defined by VB (src CSS/JS, docs chrome, same-file CSS/JS)`;
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
    console.log(`lint:doc-classes: baseline written (${all.length} findings in ${new Set(all.map((f) => f.file)).size} files).`);
    process.exit(0);
  }

  const baseline = !noBaseline && existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};
  const checked = new Set(files.map((f) => relative(ROOT, f)));
  const { fresh: findings, fixed } = applyBaseline(all, baseline, checked);

  if (summary) {
    /** @type {Map<string, { count: number, files: Set<string> }>} */
    const byKey = new Map();
    for (const f of findings) {
      const key = findingKey(f);
      const e = byKey.get(key) ?? { count: 0, files: new Set() };
      e.count++; e.files.add(f.file);
      byKey.set(key, e);
    }
    for (const [key, e] of [...byKey].sort((a, b) => b[1].count - a[1].count)) {
      console.log(`${String(e.count).padStart(4)}  ${key}  (${e.files.size} files, e.g. ${[...e.files][0]})`);
    }
    const pairs = new Set(findings.map((f) => `${f.file}\0${findingKey(f)}`));
    /** @type {Record<string, number>} */
    const byKind = {};
    for (const p of pairs) {
      const key = p.split('\0')[1];
      const kind = /^(dup|shadow):/.test(key) ? key.split(':')[0] : 'undefined';
      byKind[kind] = (byKind[kind] ?? 0) + 1;
    }
    console.log(`\n${pairs.size} file/class pairs: ${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  } else {
    for (const f of findings) console.log(`${f.file}:${f.line}  ${describe(f)}`);
  }
  if (fixed.length) {
    console.log(`lint:doc-classes: ${fixed.length} baseline entr${fixed.length === 1 ? 'y is' : 'ies are'} fixed; run \`node scripts/lint-doc-classes.mjs --update-baseline\` to shrink the baseline.`);
  }
  if (findings.length) {
    console.error(`\nlint:doc-classes: ${findings.length} finding(s) in ${new Set(findings.map((f) => f.file)).size} file(s) (checked ${files.length}).`);
    console.error('Fix the class, define it in src/, or add it to scripts/lint-doc-classes.allow.txt with a reason.');
    process.exit(1);
  }
  const debt = Object.values(baseline).reduce((n, names) => n + names.length, 0);
  console.log(`lint:doc-classes: ${files.length} files, no new findings (${debt} grandfathered in the baseline).`);
}
