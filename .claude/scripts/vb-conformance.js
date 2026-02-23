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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip comments and script/style blocks
    if (trimmed.startsWith('<!--') || trimmed.startsWith('<script') || trimmed.startsWith('<style')) continue;

    // vb/no-div — Any <div> element
    if (/<div[\s>]/i.test(line)) {
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

    // vb/no-inline-style — style="..." attributes
    if (/\sstyle="[^"]+"/i.test(line) && !/<(meta|link)/i.test(line)) {
      issues.push({
        line: lineNum,
        col: line.indexOf('style="') + 1,
        rule: 'vb/no-inline-style',
        severity: severity('vb/no-inline-style', 'error'),
        message: 'Move inline styles to CSS. Use data-* attributes for dynamic values.'
      });
    }

    // vb/no-class-for-state — State classes that should be data-* attributes
    const stateMatch = line.match(STATE_CLASS_PATTERN);
    if (stateMatch) {
      const stateClass = stateMatch[1];
      issues.push({
        line: lineNum,
        col: line.indexOf(stateClass),
        rule: 'vb/no-class-for-state',
        severity: severity('vb/no-class-for-state', 'warn'),
        message: `Class "${stateClass}" represents state. Use data-${stateClass} or data-state="${stateClass}" instead.`
      });
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
          severity: severity('vb/semantic-heading-hierarchy', 'error'),
          message: `Heading level skipped: h${lastHeadingLevel} → h${level}. Use h${lastHeadingLevel + 1} instead.`
        });
      }
      lastHeadingLevel = level;
    }

    // vb/icon-wc-required — Inline <svg> should use <icon-wc>
    if (/<svg[\s>]/i.test(line) && !/<svg[^>]*role="img"/i.test(line)) {
      issues.push({
        line: lineNum,
        col: line.indexOf('<svg') + 1,
        rule: 'vb/icon-wc-required',
        severity: severity('vb/icon-wc-required', 'error'),
        message: 'Use <icon-wc name="..."/> instead of inline SVG.'
      });
    }
  }

  // vb/no-div-wrapper — <div> wrapping a single semantic child
  // Simple regex-based detection: <div...>\n  <semantic>\n  </semantic>\n</div>
  const divWrapperPattern = /<div[^>]*>\s*\n\s*<(article|section|header|footer|nav|main|aside|ul|ol|form|table|figure|details|fieldset|dialog|menu)[^>]*>/gi;
  let wrapperMatch;
  while ((wrapperMatch = divWrapperPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, wrapperMatch.index).split('\n').length;
    issues.push({
      line: lineNum,
      col: 1,
      rule: 'vb/no-div-wrapper',
      severity: severity('vb/no-div-wrapper', 'error-new'),
      message: `<div> wraps a single <${wrapperMatch[1]}>. The div likely adds nothing — move attributes to the child.`
    });
  }

  // vb/use-form-field — Label+input outside form-field in forms with validation
  const hasForm = /<form[\s>]/i.test(content);
  const hasValidation = /required|pattern=|minlength|maxlength|type="email"|type="url"|type="number"/i.test(content);
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
