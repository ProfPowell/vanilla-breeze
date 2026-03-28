#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (fullPath.endsWith('.html')) files.push(fullPath);
  }

  return files;
}

function stripAllowedLiteralBlocks(source) {
  return source
    .replace(/<code-block\b[^>]*>[\s\S]*?<\/code-block>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '')
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '');
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

const findings = [];

for (const file of walk(DIST)) {
  const src = readFileSync(file, 'utf8');
  const stripped = stripAllowedLiteralBlocks(src);
  const match = stripped.match(/\{\{|\{%/);
  if (!match || match.index === undefined) continue;

  const line = lineNumberAt(stripped, match.index);
  const snippet = stripped.split('\n')[line - 1]?.trim() || '';

  findings.push({
    file: relative(ROOT, file),
    line,
    snippet: snippet.slice(0, 160),
  });
}

if (!findings.length) {
  console.log('No unresolved template markers found outside code examples.');
  process.exit(0);
}

console.error(`Found ${findings.length} generated HTML file(s) with unresolved template markers:\n`);
for (const finding of findings) {
  console.error(`- ${finding.file}:${finding.line}`);
  if (finding.snippet) {
    console.error(`  ${finding.snippet}`);
  }
}

process.exit(1);
