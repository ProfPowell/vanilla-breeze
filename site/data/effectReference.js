/**
 * @file effectReference.js
 * @description Build-time source for the data-effect catalogue on
 * /docs/attributes/data-effect/: the effect index (name, slot, JS, bundles)
 * and each effect's class + custom-property tables.
 *
 * Nothing structural is written by hand. Read from source:
 *   - effect names: every `[data-effect~="x"]` selector in the effect CSS and
 *     every `VB.effect('x', …)` registration in the JS;
 *   - bundles: the CSS @import graph from each CSS entry and the JS import
 *     graph from each JS entry (core, full, autoload, extras, packs), so a
 *     "core" badge means the core bundles really ship it;
 *   - classes: `.class` qualifiers on the effect's own selectors, plus the
 *     shared .slow / .fast / .bouncy when the effect reads --vb-duration /
 *     --vb-easing;
 *   - custom properties: `--vb-*` declared on the effect's base rule, read
 *     through var() in its rules and keyframes, or read by its JS through
 *     VB.params() (get / getTime / getNumber), with the default found there.
 *
 * Only prose is hand-written below (EFFECTS summaries, PROP_DOCS,
 * CLASS_DOCS). tests/unit/effect-reference-drift.test.js fails when the
 * source grows an effect, class or property that has no prose here, or when
 * prose describes something the source no longer has.
 *
 * Rendered by site/plugins/generate-effect-reference.js (markers in the
 * data-effect page).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');

export const PAGE = '/docs/attributes/data-effect/';

// ─── Bundles ────────────────────────────────────────────────────────────

/**
 * @typedef {object} Bundle
 * @property {string} id
 * @property {string} label   badge text
 * @property {string} file    what the user loads
 * @property {string} [href]  docs page for packs
 */

/** CSS entries (relative to src/). Packs are discovered. */
const CSS_ENTRIES = [
  { id: 'core', label: 'core', file: 'vanilla-breeze-core.css', entry: 'main-core.css' },
  { id: 'full', label: 'full', file: 'vanilla-breeze.css', entry: 'main.css' },
];

/** JS entries (relative to src/). Packs are discovered. */
const JS_ENTRIES = [
  { id: 'core', label: 'core', file: 'vanilla-breeze-core.js', entry: 'main-core.js' },
  { id: 'extras', label: 'extras', file: 'vanilla-breeze-extras.js', entry: 'web-components/extras.js' },
  { id: 'full', label: 'full', file: 'vanilla-breeze.js', entry: 'main.js' },
  { id: 'autoload', label: 'autoload', file: 'vanilla-breeze-autoload.js', entry: 'main-autoload.js' },
];

/** @param {string} root */
function packDirs(root) {
  const base = join(root, 'src', 'packs');
  return readdirSync(base).filter((d) => statSync(join(base, d)).isDirectory());
}

/** @param {string} css */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** @param {string} js */
const stripJsComments = (js) => js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1');

/**
 * Every CSS file reachable from an entry through CSS imports.
 * @param {string} file absolute
 * @param {Set<string>} [seen]
 */
function cssClosure(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const css = stripComments(readFileSync(file, 'utf8'));
  for (const [, spec] of css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) {
    if (/^(https?:)?\/\//.test(spec)) continue;
    cssClosure(resolve(dirname(file), spec), seen);
  }
  return seen;
}

/**
 * Every JS module reachable from an entry through static imports.
 * @param {string} file absolute
 * @param {Set<string>} [seen]
 */
function jsClosure(file, seen = new Set()) {
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const js = stripJsComments(readFileSync(file, 'utf8'));
  const specs = [
    ...js.matchAll(/^\s*import\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/gm),
    ...js.matchAll(/^\s*export\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/gm),
  ];
  for (const [, spec] of specs) {
    if (!spec.startsWith('.')) continue;
    jsClosure(resolve(dirname(file), spec), seen);
  }
  return seen;
}

/**
 * @param {string} root
 * @returns {{ css: (Bundle & {files: Set<string>})[], js: (Bundle & {files: Set<string>})[] }}
 */
export function readBundles(root = DEFAULT_ROOT) {
  const src = join(root, 'src');
  /** @type {(Bundle & {files: Set<string>})[]} */
  const css = CSS_ENTRIES.map((b) => ({ id: b.id, label: b.label, file: b.file, files: cssClosure(join(src, b.entry)) }));
  /** @type {(Bundle & {files: Set<string>})[]} */
  const js = JS_ENTRIES.map((b) => ({ id: b.id, label: b.label, file: b.file, files: jsClosure(join(src, b.entry)) }));
  for (const pack of packDirs(root)) {
    const dir = join(src, 'packs', pack);
    const top = readdirSync(dir).filter((f) => statSync(join(dir, f)).isFile());
    const meta = { id: `pack:${pack}`, label: pack, file: `packs/${pack}`, href: `/docs/packs/${pack}/` };
    /** @type {Set<string>} */
    const cssFiles = new Set();
    for (const f of top.filter((n) => n.endsWith('.css'))) cssClosure(join(dir, f), cssFiles);
    /** @type {Set<string>} */
    const jsFiles = new Set();
    for (const f of top.filter((n) => n.endsWith('.js') && !n.endsWith('.pack.js'))) jsClosure(join(dir, f), jsFiles);
    css.push({ ...meta, files: cssFiles });
    js.push({ ...meta, files: jsFiles });
  }
  return { css, js };
}

// ─── CSS parsing ────────────────────────────────────────────────────────

/**
 * @typedef {object} Rule
 * @property {string} selector  one selector (comma lists are split)
 * @property {string} body      declarations only
 * @property {string} file
 */

/**
 * Flatten a stylesheet into leaf style rules and keyframes. Descends into
 * @media / @supports / @scope / @layer / @container and nested rules.
 * @param {string} css
 * @param {string} file
 * @param {{ rules: Rule[], keyframes: Map<string, string> }} out
 */
function parseCss(css, file, out) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open === -1) break;
    const semi = css.indexOf(';', i);
    if (semi !== -1 && semi < open && /^\s*@/.test(css.slice(i, semi))) { i = semi + 1; continue; }
    const prelude = css.slice(i, open).trim().replace(/^[;}\s]+/, '');
    let depth = 1; let j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    i = j;
    const kf = /^@(?:-webkit-)?keyframes\s+([\w-]+)/.exec(prelude);
    if (kf) { out.keyframes.set(kf[1], (out.keyframes.get(kf[1]) || '') + body); continue; }
    if (prelude.startsWith('@property') || prelude.startsWith('@font-face')) continue;
    // Print resets mention effects only to switch them off.
    if (/^@media\s+print\b/.test(prelude)) continue;
    if (prelude.startsWith('@')) { parseCss(body, file, out); continue; }
    // A style rule: own declarations are the body minus nested blocks.
    const decls = body.replace(/[^{};]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
    for (const sel of splitSelectors(prelude)) out.rules.push({ selector: sel, body: decls, file });
    if (body.includes('{')) parseCss(body, file, out);
  }
}

/** Split a selector list on top-level commas. @param {string} s */
function splitSelectors(s) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const EFFECT_ATTR = /\[data-effect~="([a-z0-9-]+)"\]/g;

// ─── Hand-written prose ─────────────────────────────────────────────────

/**
 * Every effect, in catalogue order. `section` is the anchor on the
 * data-effect page; `href` points elsewhere for effects documented on their
 * own page. `kind` is used only where the effect publishes no animation slot.
 * `hooks` lists extra CSS markers (classes the effect's JS creates) used to
 * find which CSS bundles style it.
 * @type {Record<string, {summary: string, section?: string, href?: string, kind?: string, hooks?: string[], selfStyled?: boolean}>}
 */
export const EFFECTS = {
  // Entrance
  'fade-in': { summary: 'Opacity fade in.', section: 'fade-in' },
  'slide-up': { summary: 'Fade in while rising from below.', section: 'slide-up' },
  'slide-in': { summary: 'Fade in from the inline start (mirrors in RTL).', section: 'slide-in' },
  pop: { summary: 'Scale up from 80% with a springy overshoot.', section: 'pop' },
  shadow: { summary: 'Lift: a deeper shadow and a 2px rise.', section: 'shadow' },
  reveal: { summary: 'Words (or lines) rise into place one after another.', section: 'reveal', kind: 'text', hooks: ['.vb-reveal-chunk'] },
  'blur-reveal': { summary: 'Words (or lines) sharpen from a blur.', section: 'blur-reveal', kind: 'text', hooks: ['.vb-blur-chunk'] },
  typewriter: { summary: 'Types the text character by character.', section: 'typewriter', kind: 'text', hooks: ['.vb-typewriter-cursor'] },
  scramble: { summary: 'Random characters decode into the text.', section: 'scramble', kind: 'text' },
  flipboard: { summary: 'Split-flap departure board.', section: 'flipboard', kind: 'text', hooks: ['.vb-flap-board'] },
  ticker: { summary: 'Counts a <code>&lt;data value&gt;</code> number up.', section: 'ticker', kind: 'text' },
  highlight: { summary: 'Draws an underline, box or circle behind the text.', section: 'highlight', kind: 'text' },
  // Attention
  shake: { summary: 'One horizontal shake.', section: 'shake' },
  pulse: { summary: 'Repeating 5% scale pulse.', section: 'pulse' },
  bounce: { summary: 'Repeating vertical bounce.', section: 'bounce' },
  blink: { summary: 'On/off flashing that stops after about five seconds.', section: 'blink' },
  // Decoration
  float: { summary: 'Gentle repeating 8px bob.', section: 'float' },
  glow: { summary: 'Pulsing drop-shadow glow.', section: 'glow' },
  neon: { summary: 'Neon tube glow with a slow flicker.', section: 'neon' },
  rainbow: { summary: 'Hue rotates through the colour wheel.', section: 'rainbow' },
  shimmer: { summary: 'A light band sweeps across the text.', section: 'shimmer' },
  'gradient-text': { summary: 'Gradient-filled text; <code>.animate</code> makes it flow.', section: 'gradient-text' },
  'text-3d': { summary: 'Stacked shadow extrusion; <code>.animate</code> swings it.', section: 'text-3d' },
  outline: { summary: 'Stroke-only text; <code>.glow</code> pulses the stroke.', section: 'outline' },
  glitch: { summary: 'Chromatic-aberration glitch layers.', section: 'glitch', kind: 'decoration' },
  marquee: { summary: 'Children scroll horizontally in a loop.', section: 'marquee', kind: 'loop' },
  // Static
  'hard-shadow': { summary: 'Bold offset text shadow.', section: 'hard-shadow', kind: 'static' },
  stamp: { summary: 'Rubber-stamp badge with ink texture.', section: 'stamp', kind: 'static' },
  // Exit
  'fade-out': { summary: 'Opacity fade out.', section: 'fade-out' },
  'slide-out': { summary: 'Fade out toward the inline end.', section: 'slide-out' },
  collapse: { summary: 'Height and opacity to zero.', section: 'collapse' },
  // Widgets
  'animate-image': { summary: 'Play/pause button for animated GIF/WebP/APNG images.', href: '/docs/attributes/data-animate-image/', kind: 'widget', hooks: ['.animate-image-wrapper'] },
  rating: { summary: 'Clear/unrate and <code>rating:change</code> for <code>fieldset[data-rating]</code> star ratings.', href: '/docs/elements/web-components/rating/', kind: 'widget', hooks: ['[data-rating]'] },
  // Pack effects
  sparkle: { summary: 'Twinkling sparkles around the element.', section: 'sparkle', kind: 'decoration' },
  starburst: { summary: 'Starburst badge shape.', section: 'starburst', kind: 'static' },
  wiggle: { summary: 'Playful wiggle on hover.', section: 'wiggle', kind: 'attention' },
  particles: { summary: 'Floating particle burst.', section: 'particles', kind: 'decoration', selfStyled: true },
  'depth-pulse': { summary: 'Pulsing colour-font depth on <code>.vb-nabla</code> text.', href: '/docs/packs/fonts-expressive/', kind: 'decoration' },
  'memphis-confetti': { summary: 'Memphis confetti pattern background.', href: '/docs/packs/memphis/', kind: 'static' },
  'memphis-dots': { summary: 'Memphis dot pattern background.', href: '/docs/packs/memphis/', kind: 'static' },
  'memphis-squiggle': { summary: 'Memphis squiggle pattern background.', href: '/docs/packs/memphis/', kind: 'static' },
  'memphis-stripe': { summary: 'Memphis stripe pattern background.', href: '/docs/packs/memphis/', kind: 'static' },
  'memphis-zigzag': { summary: 'Memphis zigzag pattern background.', href: '/docs/packs/memphis/', kind: 'static' },
};

/** Properties that are internal plumbing, never author-facing. */
const INTERNAL = /^--(vb-anim-|_|vb-neon-intensity$|vb-outline-intensity$|vb-rainbow-hue$|vb-outline-glow$|vb-stagger-index$)/;

/**
 * Custom property descriptions. `name` is generic; `effect:name` overrides
 * for one effect.
 * @type {Record<string, string>}
 */
export const PROP_DOCS = {
  '--vb-duration': 'Animation duration (one cycle for looping effects).',
  '--vb-easing': 'Timing function.',
  '--vb-delay': 'Delay before the animation starts. Set per child by <a href="/docs/attributes/data-stagger/"><code>data-stagger</code></a>.',
  '--vb-slide-distance': 'Travel distance.',
  '--vb-bounce-height': 'Height of the first bounce (the second is half).',
  '--vb-collapse-height': 'Starting <code>max-block-size</code>. Set it to at least the element&rsquo;s natural height, or taller content jumps.',
  '--vb-shadow': 'Box shadow (resting and lifted state share it when set).',
  '--vb-glow-color': 'Glow colour.',
  '--vb-blink-rate': 'One on/off cycle.',
  '--vb-blink-count': 'Number of cycles before blinking stops. <code>infinite</code> needs a pause control (WCAG 2.2.2).',
  '--vb-neon-color': 'Tube colour (the colour classes set it).',
  '--vb-neon-spread': 'Base glow radius; the four glow layers are multiples of it.',
  '--vb-3d-color': 'Extrusion colour (the colour classes set it).',
  '--vb-3d-angle': 'Offset per extrusion layer (<code>.deep</code> sets 2px).',
  '--vb-outline-width': 'Stroke width (<code>.thick</code> 2px, <code>.ultra</code> 3px).',
  '--vb-outline-color': 'Stroke colour.',
  'outline:--vb-neon-color': 'With <code>.glow</code>: glow colour (falls back to <code>--vb-outline-color</code>).',
  '--vb-shadow-color': 'Shadow colour (the colour classes set it).',
  '--vb-shadow-offset': 'Shadow offset on both axes.',
  '--vb-stamp-color': 'Ink colour (lighter in dark mode via <code>light-dark()</code>).',
  '--vb-stamp-blend': '<code>mix-blend-mode</code>: <code>multiply</code> on light surfaces, <code>screen</code> on dark ones.',
  '--vb-rainbow-speed': 'One full hue rotation.',
  '--vb-marquee-speed': 'Time for one pass of a child.',
  '--vb-marquee-gap': 'Space after each child.',
  '--vb-shimmer-duration': 'One sweep of the light band.',
  '--vb-flip-ms': 'One flap flip: a number of milliseconds or a CSS time. JS timing and the CSS flip animation both follow it.',
  '--vb-reveal-delay': 'Stagger step between words (or lines with <code>.line</code>).',
  '--vb-reveal-duration': 'Each chunk&rsquo;s transition.',
  '--vb-blur-reveal-delay': 'Stagger step between words (or lines with <code>.line</code>).',
  '--vb-typewriter-speed': 'Time per character (a CSS time; a bare number is ms). Erasing in <code>.loop</code> runs at twice the speed.',
  '--vb-typewriter-delay': 'Wait before typing starts.',
  '--vb-scramble-duration': 'Total decode time.',
  '--vb-scramble-speed': 'Frame interval between random fills.',
  '--vb-scramble-chars': 'Fill characters, e.g. <code>01</code> (quotes are optional and stripped).',
  '--vb-ticker-duration': 'Count-up time (a CSS time; a bare number is ms). Capped at 5s.',
  '--vb-ticker-start': 'Number to count from.',
  '--vb-ticker-decimals': 'Fixed decimal places for every frame, the last included. Default: with <code>data-format-number</code>, its own format (the last frame equals the static output); otherwise the precision of <code>value</code>.',
  '--vb-highlight-color': 'Highlight colour (default: the text colour).',
};

/**
 * Class descriptions. `class` generic, `effect:class` per effect.
 * @type {Record<string, string>}
 */
export const CLASS_DOCS = {
  slow: 'Slower: 900ms for one-shot effects.',
  fast: 'Faster: 150ms for one-shot effects.',
  bouncy: 'Overshooting spring easing.',
  'pulse:slow': '3s cycle (default 1.5s).', 'pulse:fast': '0.75s cycle.',
  'bounce:slow': '2s cycle (default 1s).', 'bounce:fast': '0.5s cycle.',
  'float:slow': '6s cycle (default 3s).', 'float:fast': '1.5s cycle.',
  'glow:slow': '4s cycle (default 2s).', 'glow:fast': '1s cycle.',
  'blink:slow': '2s cycle, stops after 2 cycles.', 'blink:fast': '0.4s cycle, stops after 12 cycles.',
  'rainbow:slow': '8s rotation (default 4s).', 'rainbow:fast': '1.5s rotation.',
  'shimmer:slow': '4s sweep (default 2s).', 'shimmer:fast': '1s sweep.',
  'marquee:slow': '40s pass (default 20s).', 'marquee:fast': '8s pass.',
  'marquee:reverse': 'Scroll the other way.',
  'marquee:pause': 'Paused.',
  'marquee:hover-pause': 'Pause while hovered (keyboard focus inside always pauses).',
  'gradient-text:sunset': 'Warm palette.', 'gradient-text:ocean': 'Cool palette.',
  'gradient-text:forest': 'Green palette.', 'gradient-text:neon': 'Electric palette.',
  'gradient-text:animate': 'Flowing gradient (4s loop).',
  'neon:pink': 'Pink tube.', 'neon:cyan': 'Cyan tube.', 'neon:green': 'Green tube.', 'neon:amber': 'Amber tube.', 'neon:red': 'Red tube.',
  'text-3d:red': 'Red extrusion.', 'text-3d:gold': 'Gold extrusion.', 'text-3d:green': 'Green extrusion.',
  'text-3d:purple': 'Purple extrusion.', 'text-3d:black': 'Black extrusion.',
  'text-3d:deep': 'Twice the depth (2px per layer).', 'text-3d:animate': 'Swing the extrusion side to side (3s loop).',
  'outline:thick': '2px stroke.', 'outline:ultra': '3px stroke.', 'outline:glow': 'Glowing stroke that pulses (2s loop).',
  'hard-shadow:double': 'Second, fainter shadow.', 'hard-shadow:long': 'Long stepped shadow.',
  'hard-shadow:red': 'Red shadow.', 'hard-shadow:blue': 'Blue shadow.', 'hard-shadow:gold': 'Gold shadow.', 'hard-shadow:green': 'Green shadow.',
  'stamp:red': 'Red ink.', 'stamp:blue': 'Blue ink.', 'stamp:green': 'Green ink.', 'stamp:black': 'Black ink.', 'stamp:gold': 'Gold ink.',
  'stamp:straight': 'No rotation.', 'stamp:slight': '-2deg.', 'stamp:heavy': '-8deg.',
  'highlight:underline': 'Underline (default).', 'highlight:box': 'Filled box.', 'highlight:circle': 'Hand-drawn circle.',
  'reveal:line': 'Stagger by rendered line instead of by word (re-measured on resize).',
  'blur-reveal:line': 'Stagger by rendered line instead of by word (re-measured on resize).',
  'typewriter:loop': 'Erase and retype forever (pausable with <code>data-paused</code>).',
  'typewriter:no-cursor': 'No blinking cursor.',
  'depth-pulse:vb-nabla': 'Required: the Nabla colour font class from the fonts-expressive pack.',
};

/** Classes that are internal state, never author options. */
const INTERNAL_CLASS = /^(vb-(?!nabla)|animate-image-|paused$)/;

// ─── Derivation ─────────────────────────────────────────────────────────

/**
 * @typedef {object} PropRow
 * @property {string} name
 * @property {string} default
 * @property {'css'|'js'} source
 *
 * @typedef {object} EffectRow
 * @property {string} name
 * @property {string} summary
 * @property {string} href
 * @property {string} slot      entrance | attention | decoration | exit | text | static | widget | loop
 * @property {boolean} js       registered with VB.effect()
 * @property {boolean} selfStyled  injects its own styles (no CSS bundle needed)
 * @property {string[]} cssBundles  bundle ids that style it
 * @property {string[]} jsBundles   bundle ids that register it
 * @property {string[]} classes
 * @property {PropRow[]} props
 */

/**
 * @param {string} root
 * @returns {EffectRow[]}
 */
export function readEffects(root = DEFAULT_ROOT) {
  // The page has ~45 effectOptions markers: derive once per render, but
  // not for the life of a watch-mode process (source edits must show).
  const cached = CACHE.get(root);
  if (cached && Date.now() - cached.at < 5000) return cached.rows;
  const rows = deriveEffects(root);
  CACHE.set(root, { rows, at: Date.now() });
  return rows;
}

/** @type {Map<string, {rows: EffectRow[], at: number}>} */
const CACHE = new Map();

/**
 * @param {string} root
 * @returns {EffectRow[]}
 */
function deriveEffects(root) {
  const bundles = readBundles(root);

  // Every CSS file any bundle ships, parsed once.
  const cssFiles = new Set(bundles.css.flatMap((b) => [...b.files]));
  const parsed = { rules: /** @type {Rule[]} */ ([]), keyframes: new Map() };
  for (const f of cssFiles) {
    const css = stripComments(readFileSync(f, 'utf8'));
    parseCss(css, f, parsed);
  }

  // JS registrations: effect name → defining module.
  const jsFiles = new Set(bundles.js.flatMap((b) => [...b.files]));
  /** @type {Map<string, string>} */
  const registered = new Map();
  for (const f of jsFiles) {
    const js = stripJsComments(readFileSync(f, 'utf8'));
    for (const [, name] of js.matchAll(/VB\.effect\(\s*'([a-z0-9-]+)'/g)) registered.set(name, f);
  }

  /** @type {Map<string, {rules: Rule[]}>} */
  const byName = new Map();
  for (const rule of parsed.rules) {
    const names = [...rule.selector.matchAll(EFFECT_ATTR)].map((m) => m[1]);
    for (const n of names) {
      if (!byName.has(n)) byName.set(n, { rules: [] });
      if (new Set(names).size === 1) byName.get(n)?.rules.push(rule);
    }
  }
  const names = new Set([...byName.keys(), ...registered.keys()]);

  /** @type {EffectRow[]} */
  const rows = [];
  for (const name of names) {
    const meta = EFFECTS[name];
    const rules = byName.get(name)?.rules || [];
    // Styled by a bundle when one of its files has a (non-print) rule for
    // the effect, or one of the hook selectors its JS relies on.
    const ruleFiles = new Set(parsed.rules
      .filter((r) => r.selector.includes(`[data-effect~="${name}"]`) || (meta?.hooks || []).some((h) => r.selector.includes(h)))
      .map((r) => r.file));
    const cssBundles = bundles.css
      .filter((b) => [...b.files].some((f) => ruleFiles.has(f)))
      .map((b) => b.id);
    const jsFile = registered.get(name);
    const jsBundles = jsFile ? bundles.js.filter((b) => b.files.has(jsFile)).map((b) => b.id) : [];

    // Slot: which --vb-anim-* the effect publishes.
    const slots = new Set();
    for (const r of rules) for (const [, s] of r.body.matchAll(/--vb-anim-(entrance|attention|decoration|exit)\s*:/g)) slots.add(s);
    const slot = ['entrance', 'attention', 'decoration', 'exit'].find((s) => slots.has(s)) || meta?.kind || 'static';

    // Classes on the effect's own selectors.
    const classes = new Set();
    for (const r of rules) {
      for (const [, c] of r.selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) if (!INTERNAL_CLASS.test(c)) classes.add(c);
    }

    // Custom properties: declared on a class-free rule (default), or read
    // through var(--x, fallback) in its rules and the keyframes they use.
    /** @type {Map<string, PropRow>} */
    const props = new Map();
    const add = (prop, def, source) => {
      if (INTERNAL.test(prop)) return;
      const cur = props.get(prop);
      if (!cur) props.set(prop, { name: prop, default: def, source });
      else if (!cur.default && def) cur.default = def;
    };
    const scan = (body) => {
      for (const [, prop, fb] of body.matchAll(/var\(\s*(--vb-[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*(?:\([^()]*\))?[^()]*\))*[^()]*))?\)/g)) add(prop, (fb || '').trim(), 'css');
    };
    const usedKeyframes = new Set();
    for (const r of rules) {
      const base = !/\.[a-zA-Z]/.test(r.selector.replace(/\.vb-nabla/g, ''));
      for (const [, prop, val] of r.body.matchAll(/(--vb-[\w-]+)\s*:\s*([^;]+)/g)) {
        if (base) add(prop, val.trim(), 'css');
      }
      scan(r.body);
      for (const [, kf] of r.body.matchAll(/\b(vb-[\w-]+)\b/g)) if (parsed.keyframes.has(kf)) usedKeyframes.add(kf);
    }
    for (const kf of usedKeyframes) scan(parsed.keyframes.get(kf));
    // Shared variant classes follow --vb-duration / --vb-easing.
    if (props.has('--vb-duration')) { classes.add('slow'); classes.add('fast'); }
    if (props.has('--vb-easing')) classes.add('bouncy');

    // JS-read parameters: VB.params(el).get / getTime / getNumber('x', default).
    if (jsFile) {
      const js = stripJsComments(readFileSync(jsFile, 'utf8'));
      const consts = new Map([...js.matchAll(/const\s+([A-Z_]+)\s*=\s*([^\n]+)/g)].map((m) => [m[1], m[2].trim()]));
      for (const [, fn, key, rest] of js.matchAll(/\.(get|getTime|getNumber)\(\s*'([\w-]+)'\s*(?:,\s*([^)]+))?\)/g)) {
        let def = (rest || '').trim();
        def = consts.get(def) ?? def;
        if (!def) {
          const or = new RegExp(`get\\(\\s*'${key}'\\s*\\)\\s*\\|\\|\\s*'([^']*)'`).exec(js);
          if (or) def = or[1];
        }
        if (fn === 'getTime' && /^\d+(\.\d+)?$/.test(def)) def = `${def}ms`;
        add(`--vb-${key}`, def, 'js');
      }
      if (/params\([^)]*\)\.get\(\s*'highlight-color'/.test(js)) add('--vb-highlight-color', '', 'js');
      // Classes the JS reads: classList.contains('x').
      for (const [, c] of js.matchAll(/classList\.contains\(\s*'([\w-]+)'\s*\)/g)) classes.add(c);
    }

    rows.push({
      name,
      summary: meta?.summary || '',
      href: meta?.href || `${PAGE}#${meta?.section || name}`,
      slot,
      js: !!jsFile,
      selfStyled: !!meta?.selfStyled,
      cssBundles,
      jsBundles,
      classes: [...classes].sort(),
      props: [...props.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  const order = Object.keys(EFFECTS);
  return rows.sort((a, b) => {
    const ia = order.indexOf(a.name); const ib = order.indexOf(b.name);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.name.localeCompare(b.name);
  });
}

/**
 * Where an effect actually works: a bundle counts when it carries the CSS
 * and, for JS effects, the JS too. core ⊂ full, so "core" implies full.
 * @param {EffectRow} e
 * @returns {{ id: string, label: string, href?: string }[]}
 */
export function shipsIn(e) {
  const out = [];
  // Effects that inject their own styles (particles) need no CSS bundle.
  const css = (id) => e.selfStyled || e.cssBundles.includes(id);
  const js = (ids) => !e.js || ids.some((j) => e.jsBundles.includes(j));
  if (css('core') && js(['core'])) out.push({ id: 'core', label: 'core' });
  else if (css('full') && js(['full', 'autoload', 'extras'])) out.push({ id: 'full', label: 'full' });
  // A pack counts when it adds the effect: its CSS (CSS-only effects), or
  // its JS with the CSS from the pack or from core (packs load on top).
  const packs = new Set([...e.cssBundles, ...e.jsBundles].filter((b) => b.startsWith('pack:')));
  for (const id of packs) {
    const adds = e.js
      ? e.jsBundles.includes(id) && (css(id) || css('core'))
      : e.cssBundles.includes(id);
    if (adds) out.push({ id, label: id.slice(5), href: `/docs/packs/${id.slice(5)}/` });
  }
  return out;
}

/** @param {string} s */
export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** @param {string} effect @param {string} prop */
export const propDoc = (effect, prop) => PROP_DOCS[`${effect}:${prop}`] ?? PROP_DOCS[prop];
/** @param {string} effect @param {string} cls */
export const classDoc = (effect, cls) => CLASS_DOCS[`${effect}:${cls}`] ?? CLASS_DOCS[cls];

const JS_LABEL = { core: 'core', extras: 'extras', full: 'vanilla-breeze.js', autoload: 'autoload' };

/** @param {EffectRow} e */
function jsCell(e) {
  if (!e.js) return 'No';
  const where = e.jsBundles.map((id) => (id.startsWith('pack:') ? `${id.slice(5)} pack` : JS_LABEL[id] || id));
  return `Yes <small>(${esc(where.join(', '))})</small>`;
}

/** @param {EffectRow} e */
function badges(e) {
  return shipsIn(e).map((b) => (b.href
    ? `<a href="${b.href}"><span class="element-badge" data-type="pack">${esc(b.label)}</span></a>`
    : `<span class="element-badge" data-type="pack">${esc(b.label)}</span>`)).join(' ');
}

/** Catalogue index table. @param {string} [root] */
export function renderCatalogue(root = DEFAULT_ROOT) {
  const rows = readEffects(root).map((e) => `      <tr><td><a href="${e.href}"><code>${esc(e.name)}</code></a></td><td>${e.summary}</td><td>${esc(e.slot)}</td><td>${jsCell(e)}</td><td>${badges(e)}</td></tr>`);
  return `<table class="props-table" id="catalogue-table">
    <caption>Every <code>data-effect</code> value, generated from the effect CSS and JS. &ldquo;Ships in&rdquo; counts a bundle only when it carries the CSS and, for JS effects, the JS: <strong>core</strong> = <code>vanilla-breeze-core.css</code> + <code>.js</code> (also in the full bundle); <strong>full</strong> = <code>vanilla-breeze.css</code> with <code>vanilla-breeze.js</code>, the autoload bundle or core + extras; packs add their own CSS and JS.</caption>
    <thead><tr><th>Effect</th><th>What it does</th><th>Slot</th><th>JS</th><th>Ships in</th></tr></thead>
    <tbody>
${rows.join('\n')}
    </tbody>
  </table>`;
}

/**
 * Options for one effect: badge line, classes table, custom-property table.
 * @param {string} name
 * @param {string} [root]
 */
export function renderOptions(name, root = DEFAULT_ROOT) {
  const e = readEffects(root).find((r) => r.name === name);
  if (!e) return `<!-- effectOptions: unknown effect ${esc(name)} -->`;
  const parts = [`<p class="effect-meta">Ships in ${badges(e)} &middot; slot: <code>${esc(e.slot)}</code> &middot; JS: ${jsCell(e)}</p>`];
  if (e.classes.length) {
    parts.push(`<table class="props-table">
    <thead><tr><th>Class</th><th>Effect</th></tr></thead>
    <tbody>
${e.classes.map((c) => `      <tr><td><code>${esc(c)}</code></td><td>${classDoc(e.name, c) || ''}</td></tr>`).join('\n')}
    </tbody>
  </table>`);
  }
  if (e.props.length) {
    parts.push(`<table class="props-table">
    <thead><tr><th>Custom property</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
${e.props.map((p) => `      <tr><td><code>${esc(p.name)}</code></td><td>${p.default ? `<code>${esc(p.default)}</code>` : '&mdash;'}</td><td>${propDoc(e.name, p.name) || ''}</td></tr>`).join('\n')}
    </tbody>
  </table>`);
  }
  if (!e.classes.length && !e.props.length) parts.push('<p>No classes or custom properties.</p>');
  return parts.join('\n  ');
}

