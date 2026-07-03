#!/usr/bin/env node
/**
 * sync-tokens-catalog: Generate the public-token-set catalog vendored under
 * src/data/theme-catalog/.
 *
 * Run manually (NOT in CI) to refresh the catalog from upstream sources.
 * Each entry is a curated SUBSET of the upstream system's tokens — enough
 * to seed a recognizable VB theme, not a 1:1 import.
 *
 * For systems that publish DTCG natively (Penpot, some Figma exports), a
 * future revision can fetch upstream and store unchanged. Today every
 * entry is hand-curated from public brand documentation; the
 * `inputs[].source` URL is the canonical reference.
 *
 * Usage:
 *   npm run sync:tokens
 *
 * Output:
 *   src/data/theme-catalog/{slug}.tokens.json
 *   src/data/theme-catalog/manifest.json
 *
 * Phase 4 of vanilla-breeze-jxlv (DTCG theme pipeline).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src', 'data', 'theme-catalog');
const SYNC_DATE = new Date().toISOString().slice(0, 10);
const SPEC = '2025.10';
const VB_NS = 'com.vanilla-breeze';

mkdirSync(OUT_DIR, { recursive: true });

/* ============================================================
   Catalog inputs — one per public design system.
   Each entry is the minimum viable seed for a VB theme:
     - brand colors (primary / secondary / accent / surface / text / border)
     - typography (sans family, base size, line-height)
     - shape (border-radius scale)
     - shadow (sm/md/lg)
   ============================================================ */

const CATALOG = [
  {
    id: 'material',
    name: 'Material Design 3',
    summary: "Google's open design system. Material You color scheme with elevation surfaces.",
    homepage: 'https://m3.material.io/',
    source: 'https://m3.material.io/styles/color/system/tokens',
    license: 'Apache-2.0',
    attribution: '© Google LLC. Material is a trademark of Google LLC.',
    tags: ['color-system', 'elevation', 'material'],
    colors: {
      primary:        '#6750A4', // M3 primary purple
      'primary-hover':'#7E68B7',
      secondary:      '#625B71',
      accent:         '#7D5260',
      background:     '#FFFBFE',
      surface:        '#FFFBFE',
      'surface-raised':'#F7F2FA',
      'surface-sunken':'#F0EAF6',
      border:         '#79747E',
      'border-subtle':'#CAC4D0',
      text:           '#1C1B1F',
      'text-muted':   '#49454F',
      'text-on-primary':'#FFFFFF',
      error:          '#B3261E',
      success:        '#386A20',
      warning:        '#7D5700',
      info:           '#0061A4',
    },
    fontSans: ['Roboto', 'system-ui', 'sans-serif'],
    fontSize: 1, // rem
    lineHeight: 1.5,
    radius: { xs: 0.25, s: 0.5, m: 0.75, l: 1.0, xl: 1.5 },
  },
  {
    id: 'carbon',
    name: 'IBM Carbon',
    summary: "IBM's open design system. 14px body, zero radius, 8px grid, IBM Plex.",
    homepage: 'https://carbondesignsystem.com/',
    source: 'https://carbondesignsystem.com/elements/color/tokens/',
    license: 'Apache-2.0',
    attribution: '© IBM Corporation. Carbon Design System.',
    tags: ['enterprise', 'tight', 'plex'],
    colors: {
      primary:        '#0F62FE', // Blue 60
      'primary-hover':'#0050E6', // Blue 70
      'primary-active':'#002D9C', // Blue 80
      secondary:      '#393939', // Gray 80
      accent:         '#0F62FE',
      background:     '#F4F4F4', // Gray 10
      surface:        '#FFFFFF',
      'surface-raised':'#E0E0E0', // Gray 20
      'surface-sunken':'#E8E8E8',
      border:         '#8D8D8D', // Gray 50
      'border-subtle':'#C6C6C6', // Gray 30
      text:           '#161616', // Gray 100
      'text-muted':   '#525252', // Gray 70
      'text-on-primary':'#FFFFFF',
      error:          '#DA1E28',
      success:        '#198038',
      warning:        '#F1C21B',
      info:           '#0043CE',
    },
    fontSans: ['IBM Plex Sans', 'Arial', 'sans-serif'],
    fontSize: 0.875, // 14px
    lineHeight: 1.5,
    radius: { xs: 0, s: 0, m: 0, l: 0, xl: 0 },
  },
  {
    id: 'salesforce',
    name: 'Salesforce Lightning',
    summary: "Salesforce Lightning Design System (SLDS). Trailblazer blue, Salesforce Sans.",
    homepage: 'https://www.lightningdesignsystem.com/',
    source: 'https://www.lightningdesignsystem.com/design-tokens/',
    license: 'BSD-3-Clause',
    attribution: '© Salesforce, Inc. Lightning Design System.',
    tags: ['enterprise', 'crm'],
    colors: {
      primary:        '#0070D2', // SLDS brand blue
      'primary-hover':'#005FB2',
      'primary-active':'#004F8F',
      secondary:      '#16325C',
      accent:         '#1589EE',
      background:     '#F3F2F2',
      surface:        '#FFFFFF',
      'surface-raised':'#FAFAFA',
      'surface-sunken':'#ECEBEA',
      border:         '#C9C7C5',
      'border-subtle':'#DDDBDA',
      text:           '#080707',
      'text-muted':   '#3E3E3C',
      'text-on-primary':'#FFFFFF',
      error:          '#C23934',
      success:        '#04844B',
      warning:        '#FFB75D',
      info:           '#1589EE',
    },
    fontSans: ['Salesforce Sans', 'Arial', 'sans-serif'],
    fontSize: 0.8125, // 13px — SLDS body
    lineHeight: 1.5,
    radius: { xs: 0.125, s: 0.25, m: 0.25, l: 0.5, xl: 0.5 },
  },
  {
    id: 'govuk',
    name: 'GOV.UK Design System',
    summary: "UK Government design system. Black on white, accessible green CTA, GDS Transport.",
    homepage: 'https://design-system.service.gov.uk/',
    source: 'https://design-system.service.gov.uk/styles/colour/',
    license: 'MIT',
    attribution: '© Crown copyright. GOV.UK Design System (Open Government Licence v3.0).',
    tags: ['government', 'accessibility', 'high-contrast'],
    colors: {
      primary:        '#00703C', // GOV.UK Green (CTA)
      'primary-hover':'#005A30',
      'primary-active':'#003D1F',
      secondary:      '#1D70B8', // GOV.UK Blue (links)
      accent:         '#FFDD00', // GOV.UK Yellow (focus)
      background:     '#FFFFFF',
      surface:        '#FFFFFF',
      'surface-raised':'#F3F2F1',
      'surface-sunken':'#F8F8F8',
      border:         '#B1B4B6',
      'border-subtle':'#DEE0E2',
      text:           '#0B0C0C',
      'text-muted':   '#505A5F',
      'text-on-primary':'#FFFFFF',
      error:          '#D4351C',
      success:        '#00703C',
      warning:        '#F47738',
      info:           '#1D70B8',
    },
    fontSans: ['GDS Transport', 'arial', 'sans-serif'],
    fontSize: 1.1875, // 19px — GOV.UK body
    lineHeight: 1.31579, // GOV.UK metric
    radius: { xs: 0, s: 0, m: 0, l: 0, xl: 0 }, // GOV.UK = no radius
  },
  {
    id: 'atlassian',
    name: 'Atlassian Design Tokens',
    summary: "Atlassian (Jira/Confluence) design tokens. Indigo blue primary, Charlie typeface.",
    homepage: 'https://atlassian.design/',
    source: 'https://atlassian.design/components/tokens/',
    license: 'Apache-2.0',
    attribution: '© Atlassian Pty Ltd. Atlassian Design System.',
    tags: ['enterprise', 'productivity'],
    colors: {
      primary:        '#0052CC', // Atlassian blue
      'primary-hover':'#0747A6',
      'primary-active':'#053A8B',
      secondary:      '#42526E',
      accent:         '#6554C0', // purple accent
      background:     '#FAFBFC',
      surface:        '#FFFFFF',
      'surface-raised':'#F4F5F7',
      'surface-sunken':'#EBECF0',
      border:         '#DFE1E6',
      'border-subtle':'#EBECF0',
      text:           '#172B4D',
      'text-muted':   '#5E6C84',
      'text-on-primary':'#FFFFFF',
      error:          '#DE350B',
      success:        '#00875A',
      warning:        '#FFAB00',
      info:           '#0065FF',
    },
    fontSans: ['Charlie Display', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
    fontSize: 0.875, // 14px Atlassian body
    lineHeight: 1.4286,
    radius: { xs: 0.1875, s: 0.1875, m: 0.1875, l: 0.25, xl: 0.5 },
  },
  {
    id: 'tailwind',
    name: 'Tailwind defaults',
    summary: "Tailwind CSS default palette + spacing. Synthesized from public Tailwind docs.",
    homepage: 'https://tailwindcss.com/',
    source: 'https://tailwindcss.com/docs/customizing-colors',
    license: 'MIT',
    attribution: 'Tailwind CSS — © Tailwind Labs Inc.',
    tags: ['utility', 'web'],
    note: 'Tailwind does not publish DTCG natively; this entry is hand-synthesized from default-theme JS.',
    colors: {
      primary:        '#3B82F6', // blue-500
      'primary-hover':'#2563EB', // blue-600
      'primary-active':'#1D4ED8', // blue-700
      secondary:      '#64748B', // slate-500
      accent:         '#8B5CF6', // violet-500
      background:     '#FFFFFF',
      surface:        '#FFFFFF',
      'surface-raised':'#F8FAFC', // slate-50
      'surface-sunken':'#F1F5F9', // slate-100
      border:         '#CBD5E1', // slate-300
      'border-subtle':'#E2E8F0', // slate-200
      text:           '#0F172A', // slate-900
      'text-muted':   '#475569', // slate-600
      'text-on-primary':'#FFFFFF',
      error:          '#EF4444', // red-500
      success:        '#22C55E', // green-500
      warning:        '#F59E0B', // amber-500
      info:           '#3B82F6', // blue-500
    },
    fontSans: ['Inter', 'system-ui', 'sans-serif'],
    fontSize: 1,
    lineHeight: 1.5,
    radius: { xs: 0.125, s: 0.25, m: 0.375, l: 0.5, xl: 0.75 },
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap defaults',
    summary: "Bootstrap 5 default theme. Primary blue, system-ui font, 0.375rem radius.",
    homepage: 'https://getbootstrap.com/',
    source: 'https://getbootstrap.com/docs/5.3/customize/color/',
    license: 'MIT',
    attribution: 'Bootstrap — © The Bootstrap Authors.',
    tags: ['framework', 'web'],
    note: 'Bootstrap does not publish DTCG natively; this entry is hand-synthesized from _variables.scss.',
    colors: {
      primary:        '#0D6EFD',
      'primary-hover':'#0B5ED7',
      'primary-active':'#0A58CA',
      secondary:      '#6C757D',
      accent:         '#6F42C1',
      background:     '#FFFFFF',
      surface:        '#FFFFFF',
      'surface-raised':'#F8F9FA',
      'surface-sunken':'#E9ECEF',
      border:         '#DEE2E6',
      'border-subtle':'#E9ECEF',
      text:           '#212529',
      'text-muted':   '#6C757D',
      'text-on-primary':'#FFFFFF',
      error:          '#DC3545',
      success:        '#198754',
      warning:        '#FFC107',
      info:           '#0DCAF0',
    },
    fontSans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    fontSize: 1,
    lineHeight: 1.5,
    radius: { xs: 0.2, s: 0.25, m: 0.375, l: 0.5, xl: 1.0 },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    summary: "The dark Catppuccin flavor. Soothing pastel theme widely used in dev tooling.",
    homepage: 'https://catppuccin.com/',
    source: 'https://github.com/catppuccin/catppuccin/blob/main/docs/style-guide.md',
    license: 'MIT',
    attribution: 'Catppuccin — © Catppuccin Org.',
    tags: ['dark', 'developer'],
    colors: {
      primary:        '#CBA6F7', // mauve
      'primary-hover':'#B492EA',
      'primary-active':'#9D7CDB',
      secondary:      '#89B4FA', // blue
      accent:         '#F38BA8', // pink
      background:     '#1E1E2E', // base
      surface:        '#181825', // mantle
      'surface-raised':'#313244', // surface0
      'surface-sunken':'#11111B', // crust
      border:         '#45475A', // surface1
      'border-subtle':'#313244',
      text:           '#CDD6F4', // text
      'text-muted':   '#A6ADC8', // subtext0
      'text-on-primary':'#1E1E2E',
      error:          '#F38BA8', // red/pink
      success:        '#A6E3A1', // green
      warning:        '#F9E2AF', // yellow
      info:           '#89B4FA', // blue
    },
    fontSans: ['Inter', 'system-ui', 'sans-serif'],
    fontSize: 1,
    lineHeight: 1.5,
    radius: { xs: 0.25, s: 0.375, m: 0.5, l: 0.75, xl: 1.0 },
  },
];

/* ============================================================
   Builders
   ============================================================ */

function hexToComponents(hex) {
  const s = hex.replace('#', '');
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  // Round to 4 decimals for a clean output.
  return [r, g, b].map((n) => Number(n.toFixed(4)));
}

function colorToken(hex) {
  return {
    $type: 'color',
    $value: { colorSpace: 'srgb', components: hexToComponents(hex), hex: hex.toLowerCase() },
  };
}

function dimensionToken(value, unit = 'rem') {
  return { $type: 'dimension', $value: { value, unit } };
}

function buildEntryDoc(entry) {
  const colors = {};
  for (const [name, hex] of Object.entries(entry.colors)) colors[name] = colorToken(hex);

  const radius = {};
  for (const [name, value] of Object.entries(entry.radius)) radius[name] = dimensionToken(value);

  const doc = {
    color: colors,
    typography: {
      family: { sans: { $type: 'fontFamily', $value: entry.fontSans } },
      size:   { md:   dimensionToken(entry.fontSize) },
      lineHeight: { normal: { $type: 'number', $value: entry.lineHeight } },
    },
    border: { radius },
    $extensions: {
      [VB_NS]: {
        spec: SPEC,
        vbVersion: `catalog-${SYNC_DATE}`,
        catalog: true,
        source: {
          name:        entry.name,
          homepage:    entry.homepage,
          tokenSource: entry.source,
          license:     entry.license,
          attribution: entry.attribution,
          syncedAt:    SYNC_DATE,
          ...(entry.note ? { note: entry.note } : {}),
        },
      },
    },
  };
  return doc;
}

/* ============================================================
   Emit files
   ============================================================ */

const manifestEntries = [];

for (const entry of CATALOG) {
  const doc = buildEntryDoc(entry);
  const file = `${entry.id}.tokens.json`;
  writeFileSync(join(OUT_DIR, file), JSON.stringify(doc, null, 2));
  manifestEntries.push({
    id:           entry.id,
    name:         entry.name,
    summary:      entry.summary,
    homepage:     entry.homepage,
    source:       entry.source,
    license:      entry.license,
    attribution:  entry.attribution,
    tags:         entry.tags,
    file,
    syncedAt:     SYNC_DATE,
    ...(entry.note ? { note: entry.note } : {}),
  });
}

const manifest = {
  $schema: 'https://vanilla-breeze.com/schemas/dtcg-catalog.schema.json',
  spec: SPEC,
  syncedAt: SYNC_DATE,
  entries: manifestEntries,
};

writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`✓ Wrote ${manifestEntries.length} catalog entries to ${OUT_DIR}`);
console.log(`✓ Catalog manifest: ${manifestEntries.length} entries, sync date ${SYNC_DATE}`);
