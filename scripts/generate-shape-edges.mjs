#!/usr/bin/env node
/**
 * Generate src/shapes/edges.css (data-shape-start / data-shape-end).
 *
 * Every start/end pair (4 x 4) needs its own composed clip-path, plus RTL
 * variants for every pair that contains `diagonal`, so the file is generated
 * rather than hand-edited. Edit the fragments below, then regenerate.
 *
 *   node scripts/generate-shape-edges.mjs          write the file
 *   node scripts/generate-shape-edges.mjs --check  exit 1 if it is stale
 *   (npm run generate:shape-edges / npm run check:shape-edges)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(import.meta.dirname, '../src/shapes/edges.css');

const D = 'var(--shape-depth)';
const L = 'var(--_el)', R = 'var(--_er)';
const BD = 'var(--_ed)';
const TOUT = 'var(--_et)', BOUT = 'var(--_eb)';
const SHAPES = ['wave', 'chevron', 'scallop', 'diagonal'];

// Top edges, drawn left -> right, each ends at x = R.
const top = {
  flat: () => [`from ${L} ${TOUT}`, `line to ${R} ${TOUT}`],
  wave: () => [`from ${L} ${D}`, `line to 0% ${D}`,
    `curve to 25% 0% with 12.5% 0%`, `curve to 50% ${D} with 37.5% 0%`,
    `curve to 75% 0% with 62.5% 0%`, `curve to 100% ${D} with 87.5% 0%`,
    `line to ${R} ${D}`],
  chevron: () => [`from ${L} ${D}`, `line to 0% ${D}`, `line to 50% 0%`, `line to 100% ${D}`, `line to ${R} ${D}`],
  scallop: () => [`from ${L} ${D}`, `line to 0% ${D}`,
    ...[[16.66, 8.33], [33.33, 25], [50, 41.66], [66.66, 58.33], [83.33, 75], [100, 91.66]]
      .map(([x, c]) => `curve to ${x}% ${D} with ${c}% 0%`),
    `line to ${R} ${D}`],
  diagonal: (rtl) => rtl
    ? [`from ${L} 0%`, `line to 0% 0%`, `line to 100% ${D}`, `line to ${R} ${D}`]
    : [`from ${L} ${D}`, `line to 0% ${D}`, `line to 100% 0%`, `line to ${R} 0%`],
};

// Bottom edges, drawn right -> left, each starts at x = R and ends at x = L.
const bottom = {
  flat: () => [`line to ${R} ${BOUT}`, `line to ${L} ${BOUT}`],
  wave: () => [`line to ${R} ${BD}`, `line to 100% ${BD}`,
    `curve to 75% 100% with 87.5% 100%`, `curve to 50% ${BD} with 62.5% 100%`,
    `curve to 25% 100% with 37.5% 100%`, `curve to 0% ${BD} with 12.5% 100%`,
    `line to ${L} ${BD}`],
  chevron: () => [`line to ${R} ${BD}`, `line to 100% ${BD}`, `line to 50% 100%`, `line to 0% ${BD}`, `line to ${L} ${BD}`],
  scallop: () => [`line to ${R} ${BD}`, `line to 100% ${BD}`,
    ...[[83.33, 91.66], [66.66, 75], [50, 58.33], [33.33, 41.66], [16.66, 25], [0, 8.33]]
      .map(([x, c]) => `curve to ${x}% ${BD} with ${c}% 100%`),
    `line to ${L} ${BD}`],
  diagonal: (rtl) => rtl
    ? [`line to ${R} ${BD}`, `line to 100% ${BD}`, `line to 0% 100%`, `line to ${L} 100%`]
    : [`line to ${R} 100%`, `line to 100% 100%`, `line to 0% ${BD}`, `line to ${L} ${BD}`],
};

const path = (t, b, rtl) => `shape(\n    ${[...top[t](rtl), ...bottom[b](rtl), 'close'].join(',\n    ')}\n  )`;
const rule = (sel, t, b, rtl = false) => `${sel} {\n  clip-path: ${path(t, b, rtl)};\n}\n`;

export function renderShapeEdgesCss() {
const out = [];
const ltr = [], rtl = [];
for (const s of SHAPES) {
  ltr.push(rule(`[data-shape-start="${s}"]`, s, 'flat'));
  if (s === 'diagonal') rtl.push(rule(`[data-shape-start="diagonal"]:dir(rtl)`, s, 'flat', true));
}
for (const e of SHAPES) {
  ltr.push(rule(`[data-shape-end="${e}"]`, 'flat', e));
  if (e === 'diagonal') rtl.push(rule(`[data-shape-end="diagonal"]:dir(rtl)`, 'flat', e, true));
}
const combos = [];
for (const s of SHAPES) for (const e of SHAPES) {
  combos.push(rule(`[data-shape-start="${s}"][data-shape-end="${e}"]`, s, e));
  if (s === 'diagonal' || e === 'diagonal') rtl.push(rule(`[data-shape-start="${s}"][data-shape-end="${e}"]:dir(rtl)`, s, e, true));
}
const known = (attr) => SHAPES.map((s) => `[${attr}="${s}"]`).join(', ');

out.push(`/* Section edge shapes. Every rule is one top fragment (left to right) plus one
   bottom fragment (right to left); keep that pattern when editing.
   data-shape-start clips the top edge, data-shape-end the bottom edge, of a
   <section>, <article>, <header>, <footer> or <aside>.

   Contract:
   - --shape-depth is a <length> (default 48px). The clip depth and the
     compensating padding use the same value, so content is never clipped,
     whatever the element's height (a % depth used to resolve against height
     for the clip but against width for the padding).
   - Padding is added only for known values, and is load-bearing, so it is
     !important. Tune the space after the shape with --shape-edge-padding
     (default --size-l), not with padding-block.
   - Every start/end pair (4 x 4) has its own rule, so mixed shapes compose.
   - The clip extends 1rem past the straight sides, so focus
     rings, outlines and shadows on the inline sides and on an unshaped edge
     are not cut off. Only the shaped edge itself clips.
   - The edges are physical (top/bottom): in vertical writing modes they do
     not rotate. diagonal mirrors under :dir(rtl); the others are symmetric.
   - Forced colours and print drop the clip (backgrounds are flattened there,
     so the shape would only cut content). */

@supports (clip-path: shape(from 0% 0%, close)) {

:is(${known('data-shape-start')}, ${known('data-shape-end')}) {
  /* Shorthands for the path coordinates: 1rem of bleed past the box on
     the straight sides, and the y of the bottom shape's inner line. */
  --_el: calc(0% - 1rem);
  --_er: calc(100% + 1rem);
  --_et: calc(0% - 1rem);
  --_eb: calc(100% + 1rem);
  --_ed: calc(100% - var(--shape-depth));
}

:is(${known('data-shape-start')}) {
  padding-block-start: calc(var(--shape-depth) + var(--shape-edge-padding, var(--size-l))) !important;
}

:is(${known('data-shape-end')}) {
  padding-block-end: calc(var(--shape-depth) + var(--shape-edge-padding, var(--size-l))) !important;
}

/* ── Single edges ── */

${ltr.join('\n')}
/* ── Start + end pairs (every combination) ── */

${combos.join('\n')}
/* ── RTL: diagonal slopes the other way ── */

${rtl.join('\n')}
} /* end @supports */

@media (forced-colors: active) {
  :is([data-shape-start], [data-shape-end]) { clip-path: none; }
}

@media print {
  :is([data-shape-start], [data-shape-end]) { clip-path: none; }
}
`);
return out.join('');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const css = renderShapeEdgesCss();
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
    if (current !== css) {
      console.error('src/shapes/edges.css is stale: run node scripts/generate-shape-edges.mjs');
      process.exit(1);
    }
    console.log('shape edges css up to date');
  } else {
    writeFileSync(OUT, css);
    console.log(`wrote ${OUT.replace(process.cwd() + '/', '')}`);
  }
}
