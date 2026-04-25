#!/usr/bin/env node

/**
 * Nav-drift checker
 *
 * Verifies every web component declared in site/data/webComponents.js
 * also appears in site/data/navigation.json's "component" sidebar tree.
 * Fails (exit 1) on drift — the full build chain calls this so that a
 * newly-shipped component without a sidebar entry blocks the build.
 *
 * Why: webComponents.js drives the categorized /docs/elements/web-components/
 * landing page; navigation.json drives the sidebar visible from every
 * /docs/elements/web-components/{name}/ doc page. Out-of-sync registries
 * mean a component is reachable via one path but not the other (and the
 * page's own sidebar may not even contain a link to its own entry).
 *
 * Usage:
 *   node scripts/check-nav-drift.js          # full check, exits 1 on drift
 *   node scripts/check-nav-drift.js --warn   # report but don't fail
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const warnOnly = process.argv.includes('--warn');

/* ─────────────────────────────────────────── load registries ── */

async function loadWebComponentsRegistry() {
  const path = resolve(ROOT, 'site/data/webComponents.js');
  const mod = await import(path);
  const data = mod.default || mod;
  /* webComponents.js is a category map: { 'Forms & Input': [...], ... } */
  const all = new Map();
  for (const [category, entries] of Object.entries(data)) {
    if (!Array.isArray(entries)) continue;
    for (const e of entries) {
      if (e?.name) all.set(e.name, { category, ...e });
    }
  }
  return all;
}

function loadNavigation() {
  const path = resolve(ROOT, 'site/data/navigation.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function navComponentNames(nav) {
  /* Walk navigation.attributes/elements .component.groups[*].items */
  const names = new Set();
  const root = nav.elements?.component;
  if (!root || !Array.isArray(root.groups)) return names;
  for (const group of root.groups) {
    if (!Array.isArray(group.items)) continue;
    for (const item of group.items) {
      if (item?.name) names.add(item.name);
    }
  }
  return names;
}

/* ─────────────────────────────────────────── checks ── */

async function main() {
  const wc = await loadWebComponentsRegistry();
  const nav = loadNavigation();
  const navNames = navComponentNames(nav);

  const missingFromNav = [];
  for (const [name, entry] of wc) {
    if (!navNames.has(name)) missingFromNav.push({ name, category: entry.category });
  }

  /* Names in nav but not in webComponents.js — a softer signal. The nav
     can carry components that don't surface in the categorized landing
     page (rare, but the registries are populated from different lifecycle
     stages). Surface as a warning, not a failure. */
  const navExtras = [];
  for (const name of navNames) {
    if (!wc.has(name)) navExtras.push(name);
  }

  console.log(`[nav-drift] ${wc.size} components in webComponents.js, ${navNames.size} in navigation.json`);

  if (missingFromNav.length === 0 && navExtras.length === 0) {
    console.log('[nav-drift] ✓ no drift');
    return 0;
  }

  if (missingFromNav.length) {
    console.error(`\n[nav-drift] ✗ ${missingFromNav.length} component(s) in webComponents.js missing from navigation.json:`);
    for (const { name, category } of missingFromNav) {
      console.error(`  - ${name} (category: "${category}")`);
    }
    console.error(`\n  Fix: add an entry to site/data/navigation.json under elements.component.groups[].items`);
    console.error(`       The "Content Management" group is the conventional home for lens-family components.`);
  }

  if (navExtras.length) {
    console.warn(`\n[nav-drift] ⚠ ${navExtras.length} component(s) in navigation.json missing from webComponents.js:`);
    for (const name of navExtras) console.warn(`  - ${name}`);
    console.warn(`\n  This is usually fine if the doc page exists but the component is intentionally not in the categorized landing page.`);
  }

  return missingFromNav.length > 0 ? 1 : 0;
}

const code = await main();
if (code !== 0 && !warnOnly) process.exit(code);
