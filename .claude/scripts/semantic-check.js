#!/usr/bin/env node

/**
 * Semantic HTML Check Script
 *
 * Checks HTML files for semantic patterns beyond what linters catch:
 * - Forms should use <form-field> custom element
 * - Divs should have semantic alternatives
 * - Time elements for dates
 *
 * Usage:
 *   node scripts/semantic-check.js file.html
 */

import { readFileSync } from 'fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/semantic-check.js <file.html>');
  process.exit(1);
}

let content;
try {
  content = readFileSync(filePath, 'utf-8');
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}

const issues = [];
const lines = content.split('\n');

// Check for forms without form-field
const hasForm = /<form[\s>]/i.test(content);
const hasFormField = /<form-field[\s>]/i.test(content);

if (hasForm && !hasFormField) {
  // Find the form line
  for (let i = 0; i < lines.length; i++) {
    if (/<form[\s>]/i.test(lines[i])) {
      issues.push({
        line: i + 1,
        rule: 'semantic/form-field',
        severity: 'warning',
        message: 'Form should use <form-field> custom element instead of generic wrappers. See forms skill.'
      });
      break;
    }
  }
}

// Check for divs (additional context for fix-suggestions)
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divMatch = line.match(/<div\s+class="([^"]+)"/i);
  if (divMatch) {
    const className = divMatch[1];
    let suggestion = 'Consider semantic alternatives';

    // Provide specific suggestions based on class name
    if (className.includes('header') || className.includes('nav')) {
      suggestion = 'Consider <header> or <nav> element';
    } else if (className.includes('footer')) {
      suggestion = 'Consider <footer> element';
    } else if (className.includes('content') || className.includes('wrapper')) {
      suggestion = 'Consider if parent element can handle layout directly';
    } else if (className.includes('card') || className.includes('item')) {
      suggestion = 'Consider <article> or custom element like <product-card>';
    } else if (className.includes('sidebar') || className.includes('aside')) {
      suggestion = 'Consider <aside> element';
    } else if (className.includes('section')) {
      suggestion = 'Consider <section> element with heading';
    } else if (className.includes('grid') || className.includes('list')) {
      suggestion = 'Consider <ul> or <ol> with CSS grid layout';
    }

    issues.push({
      line: i + 1,
      rule: 'semantic/no-div',
      severity: 'info',
      message: `<div class="${className}">: ${suggestion}`
    });
  }
}

// Check for years that should use <time>
const yearPattern = /\b(19|20)\d{2}\b/g;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip if already in a time element or in attributes
  if (/<time/i.test(line) || /datetime="/i.test(line)) continue;
  // Skip meta tags and script content
  if (/<meta/i.test(line) || /<script/i.test(line)) continue;

  const matches = line.match(yearPattern);
  if (matches) {
    // Check if year is in visible content (not in attributes)
    const withoutAttrs = line.replace(/\w+="[^"]*"/g, '');
    if (yearPattern.test(withoutAttrs)) {
      issues.push({
        line: i + 1,
        rule: 'semantic/use-time',
        severity: 'info',
        message: `Year "${matches[0]}" should use <time datetime="${matches[0]}"> element`
      });
    }
  }
}

// Output in linter-like format
if (issues.length > 0) {
  console.log(`=== semantic-check ===`);
  console.log(filePath);
  for (const issue of issues) {
    const severityLabel = issue.severity === 'warning' ? 'warning' : 'info';
    console.log(`  ${issue.line}:1  ${severityLabel}  ${issue.message}  ${issue.rule}`);
  }
  console.log('');
}
