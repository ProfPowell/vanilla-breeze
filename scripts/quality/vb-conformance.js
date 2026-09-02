#!/usr/bin/env node

/**
 * VB Conformance Checker
 *
 * Enforces Vanilla Breeze architectural principles in HTML files:
 * - No divs (use semantic elements)
 * - No inline styles
 * - Data-attributes for state (not classes)
 * - Use form-field for form validation
 * - Use icon-wc instead of inline SVG
 * - Proper heading hierarchy
 * - No div wrappers around single semantic children
 *
 * Usage:
 *   node scripts/vb-conformance.js <file.html>
 *   node scripts/vb-conformance.js --ci <directory>
 *
 * Exit codes:
 *   0 - Conformant (or warnings only)
 *   1 - Errors found
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, relative, extname } from 'path';
import { execSync } from 'child_process';
import { parseHTML } from 'linkedom';
import { readLayoutVocabulary, readLayoutVocabularyByLayout, readPresenceAttrs, ESCAPE_HATCH_PROPS } from './layout-vocabulary.js';

const args = process.argv.slice(2);
const ciMode = args.includes('--ci');
const targets = args.filter(a => a !== '--ci');

if (targets.length === 0) {
  console.error('Usage: node scripts/vb-conformance.js [--ci] <file-or-directory>');
  process.exit(1);
}

const projectRoot = resolve(import.meta.dirname, '../..');
const allowlistPath = join(import.meta.dirname, '..', 'vb-conformance-allowlist.json');

// Load allowlist
let allowlist = {};
try {
  allowlist = JSON.parse(readFileSync(allowlistPath, 'utf-8'));
} catch {
  // No allowlist file — treat all violations at default severity
}

// Parsed from the layout CSS — never hand-listed. See
// admin/specs/layout-value-vocabulary-v1.md.
const layoutVocabulary = readLayoutVocabulary(projectRoot);

// Attributes whose CSS contract is presence, not value (e.g.
// [data-layout-centered], with no ="..."). No value is a no-op for these —
// skip vocabulary validation for them entirely. See layout-vocabulary.js.
const presenceLayoutAttrs = readPresenceAttrs(projectRoot);

// Per-layout vocabulary (vanilla-breeze-butz). The merged map above accepts
// any value some layout reads: data-layout-min="auto" passes on a grid because
// cover reads auto, and grid's CSS silently falls back to its default. When an
// element's layout can be resolved from its own tag, validate against that
// layout's value set instead. Child attributes (data-layout-principal, …) are
// read on a child of some other layout, so they always use the merged check.
const { byLayout: layoutVocabularyByLayout, childAttrs: layoutChildAttrs } =
  readLayoutVocabularyByLayout(projectRoot);

/**
 * The layout keys an element belongs to, from its own tag text: <layout-x>
 * is "x"; data-layout="x" is "x" plus any prefix key it matches ("body-*"
 * for the body region layouts, whose exact key holds the template and the
 * prefix key holds the shared gap rules); a data-page-layout host is
 * "page-layout". Empty when the tag names no layout the CSS knows, in which
 * case the merged vocabulary applies.
 *
 * @param {string} tag - the opening tag text, `<` through `>`
 * @returns {string[]}
 */
function resolveLayouts(tag) {
  const keys = [];
  const name = /^<layout-([a-z]+)/.exec(tag)?.[1];
  if (name && layoutVocabularyByLayout.has(name)) keys.push(name);
  const value = /\sdata-layout="([a-z-]+)"/.exec(tag)?.[1];
  if (value) {
    if (layoutVocabularyByLayout.has(value)) keys.push(value);
    for (const k of layoutVocabularyByLayout.keys()) {
      if (k.endsWith('*') && value.startsWith(k.slice(0, -1))) keys.push(k);
    }
  }
  if (/\sdata-page-layout(?:=|\s|>|\/)/.test(tag)) keys.push('page-layout');
  return keys;
}

// Check if file is tracked in git (existing) vs untracked (new)
function isNewFile(filePath) {
  try {
    execSync(`git ls-files --error-unmatch "${filePath}"`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    return false;
  } catch {
    return true;
  }
}

// State-like class names that should use data-* attributes instead
const STATE_CLASSES = [
  'active', 'inactive', 'open', 'closed', 'hidden', 'visible',
  'selected', 'disabled', 'enabled', 'expanded', 'collapsed',
  'loading', 'loaded', 'error', 'success', 'pending',
  'checked', 'focused', 'highlighted', 'current'
];

const STATE_CLASS_PATTERN = new RegExp(
  `\\bclass="[^"]*\\b(${STATE_CLASSES.join('|')})\\b[^"]*"`, 'i'
);

// Semantic alternatives for common div patterns
const DIV_ALTERNATIVES = {
  header: '<header>',
  nav: '<nav>',
  footer: '<footer>',
  sidebar: '<aside>',
  aside: '<aside>',
  section: '<section>',
  article: '<article>',
  main: '<main>',
  content: '<main> or <section>',
  wrapper: 'remove wrapper or use semantic parent',
  container: 'remove container or use <section>',
  card: '<article> or <layout-card>',
  item: '<article> or <li>',
  grid: '<layout-grid>',
  list: '<ul> or <ol>',
  actions: 'use .actions class on semantic element',
  buttons: '<footer> or element with .actions',
  group: '<fieldset> or <section>',
};

/**
 * Check a single HTML file for VB conformance
 */
function checkFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    return [];
  }

  const lines = content.split('\n');
  const issues = [];
  // Absolute offset of each line start, for reading a whole opening tag
  // (which may span lines) around a match found on one line.
  const lineOffsets = [];
  for (let i = 0, off = 0; i < lines.length; i++) {
    lineOffsets.push(off);
    off += lines[i].length + 1;
  }
  /** The opening tag `<…>` that contains the given absolute offset, or ''. */
  const tagAround = (offset) => {
    const start = content.lastIndexOf('<', offset);
    if (start === -1) return '';
    const end = content.indexOf('>', start);
    // The match must sit INSIDE the tag: if the nearest `<` closed before the
    // match, the match is text content — typically escaped markup in a
    // <pre>/<code-block> (`&lt;section data-layout="grid"&gt;`), where the
    // nearest real tag is the <pre> itself and would resolve to nonsense.
    if (end === -1 || end < offset) return '';
    const tag = content.slice(start, end + 1);
    return /^<[a-zA-Z]/.test(tag) ? tag : '';
  };
  const isNew = isNewFile(filePath);
  const relPath = relative(projectRoot, resolve(filePath));

  function isAllowlisted(rule) {
    return allowlist[rule]?.includes(relPath);
  }

  function severity(rule, defaultSev) {
    if (isAllowlisted(rule)) return 'warn';
    if (defaultSev === 'error-new') return isNew ? 'error' : 'warn';
    return defaultSev;
  }

  // Track heading levels for hierarchy check
  let lastHeadingLevel = 0;

  // Precompute source lines of <div>s that are direct children of <dl>.
  // HTML5's content model permits ONLY <div> (as a name-value grouping)
  // between <dl> and its <dt>/<dd> pairs — there is no semantic
  // alternative — so vb/no-div must not flag those.
  const dlChildDivLines = new Set();
  try {
    const { document } = parseHTML(content);
    if (document.querySelector('dl > div')) {
      const divLineNumbers = [];
      const divRe = /<div\b/gi;
      let m;
      while ((m = divRe.exec(content)) !== null) {
        divLineNumbers.push(content.substring(0, m.index).split('\n').length);
      }
      [...document.querySelectorAll('div')].forEach((div, idx) => {
        if (div.parentElement?.tagName.toLowerCase() === 'dl') {
          dlChildDivLines.add(divLineNumbers[idx]);
        }
      });
    }
  } catch {
    // linkedom can choke on malformed input; then simply don't exempt.
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip comments and script/style blocks
    if (trimmed.startsWith('<!--') || trimmed.startsWith('<script') || trimmed.startsWith('<style')) continue;

    // vb/no-div — Any <div> element (except the spec-mandated <dl> > <div>)
    if (/<div[\s>]/i.test(line) && !dlChildDivLines.has(lineNum)) {
      const classMatch = line.match(/<div\s+class="([^"]+)"/i);
      const className = classMatch ? classMatch[1] : null;
      let suggestion = 'Replace with a semantic element (<section>, <article>, <header>, <footer>, <aside>, <nav>, <main>)';

      if (className) {
        for (const [pattern, alt] of Object.entries(DIV_ALTERNATIVES)) {
          if (className.includes(pattern)) {
            suggestion = `Consider ${alt} instead of <div class="${className}">`;
            break;
          }
        }
      }

      issues.push({
        line: lineNum,
        col: line.indexOf('<div') + 1,
        rule: 'vb/no-div',
        severity: severity('vb/no-div', 'error-new'),
        message: suggestion
      });
    }

    // vb/no-inline-style — style="..." attributes.
    //
    // Exception: a style attribute whose declarations are ALL custom
    // properties, AND every one of those properties is a documented layout
    // escape hatch (ESCAPE_HATCH_PROPS: --layout-min, --layout-threshold,
    // --layout-content-min — see layout-vocabulary.js). Setting one of
    // those three passes a value into a documented CSS contract; it is not
    // styling. Any other custom property — including VB-private
    // `--_`-prefixed internals, or a made-up name nothing reads — is not a
    // public contract and stays a violation, same as mixing an escape-hatch
    // property with a real declaration.
    //
    // Iterate every style="..." on the line with matchAll, not the first
    // match only: a line can carry two style attributes (e.g. a layout
    // element wrapping a styled child), and a bare `.match()` here used to
    // return only the first, so an exempt first style attribute silently
    // exempted the rest of the line too.
    // The <meta>/<link> exemption is scoped to the tag carrying the style
    // attribute, not the whole line: a line-level guard let any element that
    // shared a line with a <link> carry inline styles unreported (lp55).
    for (const styleMatch of line.matchAll(/\sstyle="([^"]+)"/gi)) {
      {
        const tag = tagAround(lineOffsets[lineNum - 1] + styleMatch.index);
        if (/^<(meta|link)\b/i.test(tag)) continue;
        const declarations = styleMatch[1]
          .split(';')
          .map((d) => d.trim())
          .filter(Boolean);
        const isEscapeHatch =
          declarations.length > 0 &&
          declarations.every((d) => ESCAPE_HATCH_PROPS.has(d.split(':')[0].trim()));

        if (!isEscapeHatch) {
          issues.push({
            line: lineNum,
            col: styleMatch.index + 1,
            rule: 'vb/no-inline-style',
            severity: severity('vb/no-inline-style', 'error-new'),
            message: 'Move inline styles to CSS. Use data-* attributes for dynamic values.'
          });
        }
      }
    }

    // vb/layout-attr-value — data-layout-* values outside the vocabulary.
    //
    // These fail silently: an unknown value matches no attribute selector,
    // so the element falls back to its default with no error anywhere. An
    // audit found 148 such usages across the repo. Catches raw lengths,
    // keyword typos, values borrowed from another attribute's enum, and
    // attribute names that do not exist at all.
    for (const m of line.matchAll(/data-layout-([a-z-]+)="([^"]*)"/g)) {
      const [, attr, value] = m;

      // Presence-only attributes (e.g. data-layout-centered="") have no
      // value vocabulary to check against — any value, including "", is
      // exactly as valid as bare data-layout-centered. See
      // readPresenceAttrs for why this isn't just "no CSS uses ="".
      if (presenceLayoutAttrs.has(attr)) continue;

      // Prefer the vocabulary of THIS element's layout. Falls back to the
      // merged map for child attributes and for elements whose layout the
      // tag does not name.
      const layouts = layoutChildAttrs.has(attr)
        ? []
        : resolveLayouts(tagAround(lineOffsets[lineNum - 1] + m.index));
      if (layouts.length) {
        // The first candidate that reads this attribute wins; the accepted
        // attribute list in the message is the union across candidates.
        const layout = layouts.find((k) => layoutVocabularyByLayout.get(k)?.has(attr)) ?? layouts[0];
        const scoped = new Map(layouts.flatMap((k) => [...(layoutVocabularyByLayout.get(k) ?? [])]));
        const entry = layoutVocabularyByLayout.get(layout)?.get(attr);
        if (entry && entry.values.size === 0) continue; // presence-only on this layout
        if (!entry) {
          const others = [...layoutVocabularyByLayout.entries()]
            .filter(([, attrs]) => attrs.has(attr))
            .map(([name]) => name);
          issues.push({
            line: lineNum,
            col: line.indexOf(m[0]) + 1,
            rule: 'vb/layout-attr-value',
            severity: severity('vb/layout-attr-value', 'error-new'),
            message:
              `data-layout-${attr} is not read by the ${layout} layout` +
              (others.length ? ` (it belongs to ${others.sort().join(', ')})` : '') +
              `. It does nothing here; ${layout} accepts: ${[...scoped.keys()].sort().map((a) => `data-layout-${a}`).join(', ')}.`,
          });
          continue;
        }
        if (!entry.values.has(value)) {
          const hasEscapeHatch = ESCAPE_HATCH_PROPS.has(`--layout-${attr}`);
          issues.push({
            line: lineNum,
            col: line.indexOf(m[0]) + 1,
            rule: 'vb/layout-attr-value',
            severity: severity('vb/layout-attr-value', 'error-new'),
            message:
              `data-layout-${attr}="${value}" is not in the ${layout} vocabulary (${[...entry.values].sort().join(', ')}). ` +
              `Unknown values fall back to the default silently.` +
              (hasEscapeHatch ? ` For a one-off, use style="--layout-${attr}: ${value}".` : ''),
          });
        }
        continue;
      }

      const known = layoutVocabulary.get(attr);
      // Only three attributes have a documented custom-property escape
      // hatch (see ESCAPE_HATCH_PROPS). Suggesting `style="--layout-X: ..."`
      // for anything else recommends a custom property no CSS reads —
      // the same silent no-op this rule exists to catch, just relocated.
      const hasEscapeHatch = ESCAPE_HATCH_PROPS.has(`--layout-${attr}`);

      const message = !known
        ? `Unknown layout attribute data-layout-${attr}. No CSS defines it, so it does nothing.`
        : `data-layout-${attr}="${value}" is not in the vocabulary (${[...known].sort().join(', ')}). ` +
          `Unknown values fall back to the default silently.` +
          (hasEscapeHatch ? ` For a one-off, use style="--layout-${attr}: ${value}".` : '');

      if (!known || !known.has(value)) {
        issues.push({
          line: lineNum,
          col: line.indexOf(m[0]) + 1,
          rule: 'vb/layout-attr-value',
          severity: severity('vb/layout-attr-value', 'error-new'),
          message
        });
      }
    }

    // vb/no-class-for-state — State classes that should be data-* attributes.
    //
    // Token-exact match: we previously used \b boundaries inside a single
    // regex, which over-matched compound class names like "badge-success",
    // "visually-hidden", or "surface-state-card" because "-" is a non-word
    // char. Now we parse the class attribute, split on whitespace, and
    // check each token literally.
    //
    // Exception: <output class="error"> / <output class="hint"> are the
    // documented form-field contract — form-field's logic.js looks for
    // output.error to identify the validation message element. Those are
    // discriminator classes, not state classes. Skip <output> entirely.
    // Every class attribute on the line, each judged by its own tag: the
    // <output> exemption used to test the whole line, and only the first
    // class attribute was ever examined (lp55).
    for (const classAttrMatch of line.matchAll(/\bclass="([^"]+)"/g)) {
      const tag = tagAround(lineOffsets[lineNum - 1] + classAttrMatch.index);
      if (/^<output\b/i.test(tag)) continue;
      const tokens = classAttrMatch[1].split(/\s+/).filter(Boolean);
      const stateClass = tokens.find(t => STATE_CLASSES.includes(t.toLowerCase()));
      if (stateClass) {
        issues.push({
          line: lineNum,
          col: line.indexOf(stateClass, classAttrMatch.index),
          rule: 'vb/no-class-for-state',
          severity: severity('vb/no-class-for-state', 'warn'),
          message: `Class "${stateClass}" represents state. Use data-${stateClass} or data-state="${stateClass}" instead.`
        });
      }
    }

    // vb/semantic-heading-hierarchy — Skipped heading levels
    const headingMatch = trimmed.match(/^<h([1-6])[\s>]/i);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          line: lineNum,
          col: 1,
          rule: 'vb/semantic-heading-hierarchy',
          severity: severity('vb/semantic-heading-hierarchy', 'error-new'),
          message: `Heading level skipped: h${lastHeadingLevel} → h${level}. Use h${lastHeadingLevel + 1} instead.`
        });
      }
      lastHeadingLevel = level;
    }

    // vb/icon-wc-required — Inline <svg> should use <icon-wc>.
    // Opt-outs: role="img" (declares "this is a real image, not an icon")
    // or aria-hidden="true" (declares "this is decorative, no AT involvement").
    // Both signal the author knows what they're doing with this SVG; the rule
    // is only there to nudge people away from inlining icons.
    // Each <svg> on the line is judged by its own opening tag (which may
    // continue on following lines), not by whether any svg on the line
    // carries the opt-out (lp55).
    for (const svgMatch of line.matchAll(/<svg[\s>]/gi)) {
      const tag = tagAround(lineOffsets[lineNum - 1] + svgMatch.index + 1);
      if (/\srole="img"/i.test(tag) || /\saria-hidden="true"/i.test(tag)) continue;
      issues.push({
        line: lineNum,
        col: svgMatch.index + 1,
        rule: 'vb/icon-wc-required',
        severity: severity('vb/icon-wc-required', 'error-new'),
        message: 'Use <icon-wc name="..."/> instead of inline SVG.'
      });
    }
  }

  // vb/no-div-wrapper — <div> wrapping a single semantic child.
  // DOM-based detection via linkedom: a <div> is flagged only if it
  // contains exactly one element child AND that child is in the semantic
  // list. The previous regex was too eager — it matched any <div>\n<semantic>
  // pattern regardless of how many siblings followed, producing many false
  // positives on multi-child grid containers.
  const SEMANTIC_CHILDREN = new Set([
    'article', 'section', 'header', 'footer', 'nav', 'main', 'aside',
    'ul', 'ol', 'form', 'table', 'figure', 'details', 'fieldset',
    'dialog', 'menu'
  ]);
  try {
    const { document } = parseHTML(content);
    // Precompute source line numbers for every <div opening so we can
    // map the Nth linkedom-found div to the Nth source-found div by
    // document order. (querySelectorAll('div') returns elements in
    // document order, matching their appearance in source.)
    const divLineNumbers = [];
    {
      const divRe = /<div\b/gi;
      let m;
      while ((m = divRe.exec(content)) !== null) {
        divLineNumbers.push(content.substring(0, m.index).split('\n').length);
      }
    }
    let i = 0;
    for (const div of document.querySelectorAll('div')) {
      const sourceLine = divLineNumbers[i] || 1;
      i++;
      const elementChildren = Array.from(div.children);
      if (elementChildren.length !== 1) continue;
      const child = elementChildren[0];
      const tag = child.tagName.toLowerCase();
      if (!SEMANTIC_CHILDREN.has(tag)) continue;
      issues.push({
        line: sourceLine,
        col: 1,
        rule: 'vb/no-div-wrapper',
        severity: severity('vb/no-div-wrapper', 'error-new'),
        message: `<div> wraps a single <${tag}>. The div likely adds nothing — move attributes to the child.`
      });
    }
  } catch {
    // linkedom can choke on malformed input; skip silently rather than
    // failing the whole conformance run.
  }

  // vb/use-form-field — Label+input outside form-field in forms with validation
  const hasForm = /<form[\s>]/i.test(content);
  // Anchor validation to actual form controls — a bare /required/ match
  // also hit the English word "required" in prose (e.g. "No JavaScript
  // required"), firing on button-only <form method="dialog"> demos.
  const hasValidation =
    /<(input|textarea|select)\b[^>]*\b(required|pattern=|minlength=|maxlength=)/i.test(content) ||
    /type="(email|url|number)"/i.test(content);
  if (hasForm && hasValidation) {
    const hasFormField = /<form-field[\s>]/i.test(content);
    if (!hasFormField) {
      const formLine = lines.findIndex(l => /<form[\s>]/i.test(l));
      issues.push({
        line: formLine + 1,
        col: 1,
        rule: 'vb/use-form-field',
        severity: severity('vb/use-form-field', 'warn'),
        message: 'Form with validation should use <form-field> wrapper for inputs. See forms skill.'
      });
    }
  }

  return issues;
}

/**
 * Collect HTML files from a directory recursively
 */
function collectHtmlFiles(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...collectHtmlFiles(fullPath));
      } else if (stat.isFile() && /\.(html|htm|xhtml)$/.test(entry) && !entry.startsWith('_')) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory not accessible
  }
  return files;
}

// Main execution
let files = [];
for (const target of targets) {
  const resolved = resolve(target);
  try {
    if (statSync(resolved).isDirectory()) {
      files.push(...collectHtmlFiles(resolved));
    } else {
      files.push(resolved);
    }
  } catch {
    console.error(`Not found: ${target}`);
    process.exit(1);
  }
}

let totalErrors = 0;
let totalWarnings = 0;
let totalInfo = 0;

for (const file of files) {
  const issues = checkFile(file);
  if (issues.length === 0) continue;

  const relPath = relative(projectRoot, resolve(file));
  console.log(`=== vb-conformance ===`);
  console.log(relPath);
  for (const issue of issues) {
    const sevLabel = issue.severity === 'error' ? 'error' : issue.severity === 'warn' ? 'warning' : 'info';
    console.log(`  ${issue.line}:${issue.col}  ${sevLabel}  ${issue.message}  ${issue.rule}`);
    if (issue.severity === 'error') totalErrors++;
    else if (issue.severity === 'warn') totalWarnings++;
    else totalInfo++;
  }
  console.log('');
}

if (ciMode && files.length > 0) {
  console.log(`VB Conformance: ${files.length} file(s) checked, ${totalErrors} error(s), ${totalWarnings} warning(s), ${totalInfo} info`);
}

process.exit(totalErrors > 0 ? 1 : 0);
