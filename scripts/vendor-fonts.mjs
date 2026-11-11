#!/usr/bin/env node
/**
 * vendor-fonts.mjs: fetch the self-hosted typefaces into src/fonts/.
 *
 * Themes, the Kawaii pack and wireframe mode use these faces. Each family is
 * taken from its Fontsource npm package at a pinned version, so the files do
 * not change unless the version here does. For every family the script writes:
 *
 *   src/fonts/<id>-<subset>-<variant>.woff2   Latin and Latin Extended subsets
 *   src/fonts/<id>.css                        the @font-face rules
 *   src/fonts/<id>-OFL.txt                    the licence shipped with the files
 *
 * A theme imports the stylesheet ("../../fonts/nunito.css"); the CDN build
 * inlines the rules and emits the woff2 files to dist/cdn/fonts/.
 *
 * Run: node scripts/vendor-fonts.mjs [id ...]     (no ids = every family)
 * The only network access is `npm pack` against the npm registry.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'fonts');
const SUBSETS = ['latin', 'latin-ext'];

/**
 * variants name the Fontsource face: "wght-normal" is the upright variable
 * file, "opsz-normal" adds the optical-size axis, "400-normal" is a static
 * weight. Keep the list to what a theme actually uses.
 *
 * @type {{ id: string, family: string, pkg: string, version: string, variants: string[] }[]}
 */
export const FAMILIES = [
  // Variable
  { id: 'big-shoulders-display', family: 'Big Shoulders Display', pkg: '@fontsource-variable/big-shoulders-display', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'caveat', family: 'Caveat', pkg: '@fontsource-variable/caveat', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'dm-sans', family: 'DM Sans', pkg: '@fontsource-variable/dm-sans', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'exo-2', family: 'Exo 2', pkg: '@fontsource-variable/exo-2', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'fira-code', family: 'Fira Code', pkg: '@fontsource-variable/fira-code', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'fraunces', family: 'Fraunces', pkg: '@fontsource-variable/fraunces', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'inter', family: 'Inter', pkg: '@fontsource-variable/inter', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'jetbrains-mono', family: 'JetBrains Mono', pkg: '@fontsource-variable/jetbrains-mono', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'josefin-sans', family: 'Josefin Sans', pkg: '@fontsource-variable/josefin-sans', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'lora', family: 'Lora', pkg: '@fontsource-variable/lora', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'merriweather', family: 'Merriweather', pkg: '@fontsource-variable/merriweather', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'newsreader', family: 'Newsreader', pkg: '@fontsource-variable/newsreader', version: '5.3.0', variants: ['wght-normal', 'wght-italic'] },
  { id: 'nunito', family: 'Nunito', pkg: '@fontsource-variable/nunito', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'orbitron', family: 'Orbitron', pkg: '@fontsource-variable/orbitron', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'playfair-display', family: 'Playfair Display', pkg: '@fontsource-variable/playfair-display', version: '5.3.0', variants: ['wght-normal'] },
  { id: 'shantell-sans', family: 'Shantell Sans', pkg: '@fontsource-variable/shantell-sans', version: '5.3.0', variants: ['wght-normal', 'wght-italic'] },
  { id: 'source-code-pro', family: 'Source Code Pro', pkg: '@fontsource-variable/source-code-pro', version: '5.3.1', variants: ['wght-normal'] },
  // Static
  { id: 'barlow-condensed', family: 'Barlow Condensed', pkg: '@fontsource/barlow-condensed', version: '5.3.0', variants: ['400-normal', '500-normal', '600-normal', '700-normal'] },
  { id: 'courier-prime', family: 'Courier Prime', pkg: '@fontsource/courier-prime', version: '5.3.0', variants: ['400-normal', '700-normal'] },
  { id: 'dm-serif-display', family: 'DM Serif Display', pkg: '@fontsource/dm-serif-display', version: '5.3.0', variants: ['400-normal'] },
  { id: 'flow-block', family: 'Flow Block', pkg: '@fontsource/flow-block', version: '5.3.0', variants: ['400-normal'] },
  { id: 'ibm-plex-mono', family: 'IBM Plex Mono', pkg: '@fontsource/ibm-plex-mono', version: '5.3.0', variants: ['400-normal', '700-normal'] },
  { id: 'press-start-2p', family: 'Press Start 2P', pkg: '@fontsource/press-start-2p', version: '5.3.0', variants: ['400-normal'] },
  { id: 'redacted-script', family: 'Redacted Script', pkg: '@fontsource/redacted-script', version: '5.3.0', variants: ['300-normal', '400-normal', '700-normal'] },
  { id: 'share-tech-mono', family: 'Share Tech Mono', pkg: '@fontsource/share-tech-mono', version: '5.3.0', variants: ['400-normal'] },
  { id: 'space-mono', family: 'Space Mono', pkg: '@fontsource/space-mono', version: '5.3.0', variants: ['400-normal', '700-normal'] },
  { id: 'vt323', family: 'VT323', pkg: '@fontsource/vt323', version: '5.3.0', variants: ['400-normal'] },
];

/**
 * Every "@font-face" block in a Fontsource stylesheet, keyed by the comment
 * that names it (for example "nunito-latin-wght-normal").
 *
 * @param {string} css
 * @returns {Map<string, Record<string, string>>}
 */
export function parseFaces(css) {
  const faces = new Map();
  for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    /** @type {Record<string, string>} */
    const decls = {};
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    }
    if (!faces.has(m[1])) faces.set(m[1], decls);
  }
  return faces;
}

/**
 * One "@font-face" rule pointing at the vendored file.
 *
 * @param {string} family
 * @param {string} file
 * @param {Record<string, string>} decls
 */
export function faceRule(family, file, decls) {
  const range = decls['unicode-range'] ? `\n  unicode-range: ${decls['unicode-range'].replace(/,\s*/g, ', ')};` : '';
  return `@font-face {
  font-family: "${family}";
  src: url("./${file}") format("woff2");
  font-weight: ${decls['font-weight']};
  font-style: ${decls['font-style']};
  font-display: swap;${range}
}`;
}

function vendor(fam, work) {
  const dir = join(work, fam.id);
  mkdirSync(dir, { recursive: true });
  const tgz = execFileSync('npm', ['pack', '--silent', '--ignore-scripts', `${fam.pkg}@${fam.version}`], { cwd: dir, encoding: 'utf8' }).trim().split('\n').pop() ?? '';
  execFileSync('tar', ['-xzf', join(dir, tgz), '-C', dir]);
  const pkgDir = join(dir, 'package');

  const faces = new Map();
  for (const f of readdirSync(pkgDir).filter((f) => f.endsWith('.css'))) {
    for (const [k, v] of parseFaces(readFileSync(join(pkgDir, f), 'utf8'))) if (!faces.has(k)) faces.set(k, v);
  }

  const rules = [];
  let bytes = 0;
  for (const variant of fam.variants) {
    let found = 0;
    for (const subset of SUBSETS) {
      const key = `${fam.id}-${subset}-${variant}`;
      const decls = faces.get(key);
      if (!decls) continue; // some families have no Latin Extended subset
      const file = `${key}.woff2`;
      copyFileSync(join(pkgDir, 'files', file), join(OUT, file));
      bytes += readFileSync(join(OUT, file)).length;
      rules.push(faceRule(fam.family, file, decls));
      found++;
    }
    if (!found) throw new Error(`${fam.pkg}: no "${variant}" face for ${SUBSETS.join(' or ')}`);
  }

  copyFileSync(join(pkgDir, 'LICENSE'), join(OUT, `${fam.id}-OFL.txt`));
  writeFileSync(join(OUT, `${fam.id}.css`), `/**
 * ${fam.family}: self-hosted. SIL Open Font License 1.1 (${fam.id}-OFL.txt
 * beside this file). Generated by scripts/vendor-fonts.mjs from
 * ${fam.pkg}@${fam.version}; edit the script, not this file.
 *
 * @font-face only declares the face. A browser downloads a file when text
 * renders in this family, so a page pays for the theme in use and no other.
 * Latin and Latin Extended subsets, split by unicode-range.
 */

${rules.join('\n\n')}
`);
  return bytes;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2);
  const todo = only.length ? FAMILIES.filter((f) => only.includes(f.id)) : FAMILIES;
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'vb-fonts-'));
  let total = 0;
  try {
    for (const fam of todo) {
      const bytes = vendor(fam, work);
      total += bytes;
      console.log(`  ${fam.id.padEnd(24)} ${String(Math.round(bytes / 1024)).padStart(4)} KB`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  console.log(`  ${todo.length} families, ${Math.round(total / 1024)} KB`);
}
