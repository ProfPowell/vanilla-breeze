#!/usr/bin/env node
/**
 * Generate the local placeholder images demos and docs use instead of
 * hot-linking picsum.photos (vanilla-breeze-uz4f).
 *
 * Reads src/assets/placeholders/manifest.json — a list of { seed, width,
 * height } — and writes one deterministic SVG per entry as
 * src/assets/placeholders/photo-<seed>-<w>x<h>.svg. The seed drives the hue
 * and the skyline shape, so a gallery of different seeds looks varied while
 * every run produces byte-identical files (the visual suite depends on that).
 *
 * Add an entry to the manifest and re-run: node scripts/generate-placeholders.mjs
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'placeholders');
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));

/** Small deterministic PRNG so a seed always yields the same picture. */
function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function placeholderSvg({ seed, width, height }) {
  const r = rng(seed);
  const hue = Math.floor(r() * 360);
  const hue2 = (hue + 40 + Math.floor(r() * 60)) % 360;
  const sky = `oklch(88% 0.05 ${hue})`;
  const skyLow = `oklch(78% 0.08 ${hue2})`;
  const far = `oklch(62% 0.08 ${hue2})`;
  const near = `oklch(45% 0.07 ${hue})`;
  const sunX = Math.round(width * (0.2 + r() * 0.6));
  const sunY = Math.round(height * (0.2 + r() * 0.25));
  const sunR = Math.round(Math.min(width, height) * (0.06 + r() * 0.06));
  const ridge = (base, amp, n) => {
    const pts = [`0,${height}`];
    for (let i = 0; i <= n; i++) {
      const x = Math.round((width * i) / n);
      const y = Math.round(height * (base - r() * amp));
      pts.push(`${x},${y}`);
    }
    pts.push(`${width},${height}`);
    return pts.join(' ');
  };
  const label = `${width}×${height}`;
  const fs = Math.max(12, Math.round(Math.min(width, height) * 0.06));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Placeholder image ${label}">
  <title>Placeholder image ${label}</title>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky}"/>
      <stop offset="1" stop-color="${skyLow}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="oklch(96% 0.06 ${(hue + 180) % 360})" opacity="0.9"/>
  <polygon points="${ridge(0.62, 0.22, 6)}" fill="${far}"/>
  <polygon points="${ridge(0.8, 0.2, 5)}" fill="${near}"/>
  <text x="${width - 8}" y="${height - 8}" text-anchor="end" font-family="system-ui, sans-serif" font-size="${fs}" fill="oklch(98% 0 0)" opacity="0.7">${label}</text>
</svg>
`;
}

export const fileName = ({ seed, width, height }) => `photo-${seed}-${width}x${height}.svg`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wanted = new Set(manifest.map(fileName));
  for (const f of readdirSync(dir)) if (f.endsWith('.svg') && !wanted.has(f)) unlinkSync(join(dir, f));
  for (const entry of manifest) writeFileSync(join(dir, fileName(entry)), placeholderSvg(entry));
  console.log(`${manifest.length} placeholder(s) written to src/assets/placeholders/`);
}
