#!/usr/bin/env node
/**
 * vb-check: validate HTML against Vanilla Breeze's element metadata and
 * conventions. No configuration file needed.
 *
 *   vb-check page.html [more.html | directory ...] [--json] [--quiet]
 *
 * Lists every problem with file, line, column, rule and the fix. Exits 1
 * when there are errors, 2 on a usage or setup problem, 0 otherwise
 * (warnings alone do not fail).
 *
 * Needs html-validate, an optional peer dependency of vanilla-breeze:
 *   npm install --save-dev html-validate
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const USAGE = `Usage: vb-check <file.html | directory> [...] [--json] [--quiet]

  --json    print the report as JSON
  --quiet   errors only (hide warnings)
  --help    show this message`;

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const targets = args.filter((arg) => !arg.startsWith('--'));

if (flags.has('--help') || flags.has('-h')) {
  console.log(USAGE);
  process.exit(0);
}
if (!targets.length) {
  console.error(USAGE);
  process.exit(2);
}

let HtmlValidate;
let StaticConfigLoader;
try {
  ({ HtmlValidate, StaticConfigLoader } = await import('html-validate'));
} catch {
  console.error('vb-check needs html-validate, which is not installed.\n\n  npm install --save-dev html-validate\n');
  process.exit(2);
}
const { default: plugin } = await import('../src/htmlvalidate/plugin.js');

/**
 * @param {string} target
 * @returns {string[]}
 */
function htmlFiles(target) {
  const full = resolve(target);
  if (!existsSync(full)) {
    console.error(`vb-check: no such file or directory: ${target}`);
    process.exit(2);
  }
  if (!statSync(full).isDirectory()) return [full];
  return readdirSync(full, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.html?$/.test(entry.name) && !/(^|\/)node_modules(\/|$)/.test(entry.parentPath))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

/** Whole documents also get the document rules (doctype, lang, title). */
const config = (/** @type {boolean} */ isDocument) => ({
  root: true,
  plugins: [plugin],
  extends: ['html-validate:recommended', ...(isDocument ? ['html-validate:document'] : []), 'vanilla-breeze:recommended'],
});
const validators = {
  document: new HtmlValidate(new StaticConfigLoader(config(true))),
  fragment: new HtmlValidate(new StaticConfigLoader(config(false))),
};

const quiet = flags.has('--quiet');
const files = [...new Set(targets.flatMap(htmlFiles))];
const results = [];
let errors = 0;
let warnings = 0;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const validator = /<html[\s>]/i.test(source) ? validators.document : validators.fragment;
  const report = await validator.validateString(source, file);
  const messages = (report.results[0]?.messages ?? [])
    .filter((message) => !quiet || message.severity === 2)
    .map((message) => ({
      line: message.line,
      column: message.column,
      severity: message.severity === 2 ? 'error' : 'warning',
      rule: message.ruleId,
      message: message.message,
      url: message.ruleUrl,
    }));
  errors += messages.filter((m) => m.severity === 'error').length;
  warnings += messages.filter((m) => m.severity === 'warning').length;
  const shown = relative(process.cwd(), file);
  results.push({ file: shown && !shown.startsWith('..') ? shown : file, messages });
}

if (flags.has('--json')) {
  console.log(JSON.stringify({ files: results, errors, warnings }, null, 2));
} else {
  for (const { file, messages } of results) {
    for (const m of messages) console.log(`${file}:${m.line}:${m.column}  ${m.severity}  ${m.message}  [${m.rule}]`);
  }
  const count = (/** @type {number} */ n, /** @type {string} */ word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const summary = `${count(files.length, 'file')} checked: ${count(errors, 'error')}, ${count(warnings, 'warning')}`;
  console.log(errors || warnings ? `\n${summary}` : `${summary}. No problems found.`);
}

process.exit(errors ? 1 : 0);
