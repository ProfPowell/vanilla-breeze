/**
 * Static checks on styling tokens that once looked right and did nothing,
 * or were readable in one mode only:
 *   - --radius-inner resolved on :root, so it ignored the parent's radius
 *   - --page-bg-image sat in a var() fallback that never applied
 *   - paper surfaces and the brand -subtle shades had no dark value
 *   - --glass-blur defaulted to 0px, so "frosted" had no blur
 *   - data-shadow material / flicker ignored data-motion-reduced
 *   - text on the primary color was a fixed white (3.3:1 in dark mode)
 *   - the dark shadow overrides stopped at --shadow-xl
 *
 * Run: node --test tests/unit/styling-token-contracts.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import postcss from 'postcss';

const repo = resolve(import.meta.dirname, '../..');
const read = (rel) => readFileSync(join(repo, rel), 'utf8');
const parse = (rel) => postcss.parse(read(rel), { from: rel });

/** Declarations of `prop` as [{ selector, value, media }]. */
function decls(root, prop) {
  const out = [];
  root.walkDecls(prop, (d) => {
    let media = '';
    for (let p = d.parent; p && p.type !== 'root'; p = p.parent) {
      if (p.type === 'atrule' && p.name === 'media') media = p.params;
    }
    out.push({ selector: d.parent.selector ?? '', value: d.value.replace(/\s+/g, ' '), media });
  });
  return out;
}

/* ---- WCAG contrast for oklch() literals ---- */
function luminance(str) {
  const m = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/.exec(str);
  assert.ok(m, `not an oklch() literal: ${str}`);
  const L = m[2] ? Number(m[1]) / 100 : Number(m[1]);
  const C = Number(m[3]);
  const h = (Number(m[4]) * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v) => Math.min(1, Math.max(0, v));
  return 0.2126 * clip(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s)
    + 0.7152 * clip(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s)
    + 0.0722 * clip(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
}
const contrast = (x, y) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};
/** The two arguments of a light-dark(a, b) value. */
function lightDark(value) {
  const m = /^light-dark\(\s*(oklch\([^)]*\))\s*,\s*(oklch\([^)]*\))\s*\)$/.exec(value);
  assert.ok(m, `expected light-dark(oklch(), oklch()), got: ${value}`);
  return { light: m[1], dark: m[2] };
}

const themeFiles = readdirSync(join(repo, 'src/tokens/themes'))
  .filter((f) => /^_(brand|extreme|access)-.*\.css$/.test(f) && !f.includes('template'))
  .map((f) => `src/tokens/themes/${f}`);

test('--radius-inner is declared where it must resolve, not only on :root', () => {
  const found = decls(parse('src/tokens/borders.css'), '--radius-inner');
  assert.ok(found.length > 0);
  for (const d of found) {
    assert.match(d.value, /var\(--_radius\b.*var\(--_inset\b/);
    assert.equal(d.selector, '*', 'a :root or [data-theme] declaration is computed there once and inherited as a finished value');
  }
});

test('body paints --page-bg-gradient and --page-bg-image as separate layers', () => {
  const [bg] = decls(parse('src/base/reset.css'), 'background-image').filter((d) => d.selector === 'body');
  assert.ok(bg, 'body background-image not found');
  assert.doesNotMatch(bg.value, /var\(--page-bg-gradient,\s*var\(/, '--page-bg-gradient is always defined, so a nested fallback never applies');
  assert.match(bg.value, /^var\(--page-bg-gradient(, none)?\), var\(--page-bg-image(, none)?\)$/);
});

test('paper surfaces have a dark value and body text reaches AA on them in every theme', () => {
  const tokens = parse('src/tokens/extensions/surfaces.css');
  const value = (prop) => decls(tokens, prop).find((d) => d.selector === ':root').value;
  for (const prop of ['--surface-dot', '--surface-rule', '--surface-margin']) lightDark(value(prop));
  const papers = { paper: lightDark(value('--surface-paper')), kraft: lightDark(value('--surface-kraft')) };

  // The surface rules set a background and leave the text colour alone.
  const types = parse('src/utils/surface-types.css');
  types.walkRules(/data-surface="(paper|dots|grid|lines|kraft)"/, (rule) => {
    assert.match(rule.toString(), /var\(--surface-(paper|kraft)\)/);
  });

  // Core text colours (colors.css), then every theme's own --color-text.
  const texts = [
    { where: 'core light', scheme: 'light', text: 'oklch(15% 0 0)' },
    { where: 'core dark', scheme: 'dark', text: 'oklch(93% 0.01 260)' },
  ];
  for (const rel of themeFiles) {
    parse(rel).walkRules((rule) => {
      let scheme, text;
      rule.each((n) => {
        if (n.type !== 'decl') return;
        if (n.prop === 'color-scheme') scheme = n.value.trim();
        if (n.prop === '--color-text' && /^oklch\([\d.%\s]+\)$/.test(n.value.trim())) text = n.value.trim();
      });
      if (text && (scheme === 'light' || scheme === 'dark')) texts.push({ where: `${rel} ${rule.selector.split(',')[0]}`, scheme, text });
    });
  }
  assert.ok(texts.length > 40, `only ${texts.length} text colours found`);
  const low = [];
  for (const { where, scheme, text } of texts) {
    for (const [name, pair] of Object.entries(papers)) {
      const ratio = contrast(text, pair[scheme]);
      // Solarized's body text is L48% by design (5:1 on its own cream) and
      // does not reach AA on mid-tone light kraft.
      if (name === 'kraft' && scheme === 'light' && where.includes('solarized')) continue;
      if (ratio < 4.5) low.push(`${where}: ${text} on ${name} ${pair[scheme]} = ${ratio.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});

test('--glass-blur has a real default, so data-surface="frosted" blurs without a theme', () => {
  const [blur] = decls(parse('src/tokens/extensions/surfaces.css'), '--glass-blur').filter((d) => d.selector === ':root');
  assert.match(blur.value, /^\d+(\.\d+)?px$/);
  assert.ok(parseFloat(blur.value) >= 4, `--glass-blur default is ${blur.value}`);
  assert.match(read('src/utils/surface-types.css'), /\[data-surface="frosted"\] \{[^}]*backdrop-filter: blur\(var\(--glass-blur/);
});

test('data-shadow material and flicker stop for data-motion-reduced as well as the media query', () => {
  const root = parse('src/tokens/extensions/shadow-effects.css');
  const off = { transition: false, transform: false, animation: false };
  root.walkRules((rule) => {
    for (const sel of rule.selectors) {
      if (!sel.startsWith(':root[data-motion-reduced] ')) continue;
      rule.walkDecls((d) => {
        if (d.value !== 'none') return;
        if (d.prop === 'transition' && sel.includes('"material"')) off.transition = true;
        if (d.prop === 'transform' && sel.includes('"material"') && /:hover|:focus-visible/.test(sel)) off.transform = true;
        if (d.prop === 'animation' && sel.includes('"flicker"')) off.animation = true;
      });
    }
  });
  assert.deepEqual(off, { transition: true, transform: true, animation: true });
});

test('brand -subtle shades are a pale tint in light mode and a deep one in dark mode', () => {
  for (const rel of ['src/tokens/colors.css', 'src/tokens/themes/_accents.css']) {
    const root = parse(rel);
    for (const name of ['primary', 'secondary', 'accent']) {
      const found = decls(root, `--color-${name}-subtle`);
      assert.ok(found.length > 0, `${rel}: --color-${name}-subtle`);
      for (const d of found) {
        const m = /^light-dark\( ?oklch\(from var\(--color-\w+\) ([\d.]+) [\d.]+ h\), ?oklch\(from var\(--color-\w+\) ([\d.]+) [\d.]+ h\) ?\)$/.exec(d.value);
        assert.ok(m, `${rel}: ${d.value}`);
        assert.ok(Number(m[1]) >= 0.9 && Number(m[2]) <= 0.3, `${rel}: lightness ${m[1]} / ${m[2]}`);
      }
    }
  }
});

test('text on primary is derived from the fill; theme overrides reach AA', () => {
  const core = parse('src/tokens/colors.css');
  for (const fill of ['primary', 'interactive']) {
    const found = decls(core, `--color-text-on-${fill}`);
    assert.ok(found.length > 0);
    for (const d of found) assert.match(d.value, new RegExp(`^color\\(from var\\(--color-${fill}\\) xyz-d65 `), 'a fixed colour cannot follow the theme or the mode');
  }
  // y = 0.1791 is where black and white give the same contrast (4.58:1).
  const [k] = decls(core, '--_on-color-k');
  assert.match(k.value, /\(0\.1791 - y\)/);

  // A theme that sets the token itself must pair it with its own primary.
  let checked = 0;
  const low = [];
  for (const rel of themeFiles) {
    parse(rel).walkRules((rule) => {
      const own = {};
      rule.each((n) => { if (n.type === 'decl' && /^--color-(primary|text-on-primary)$/.test(n.prop)) own[n.prop] = n.value.trim(); });
      if (!own['--color-text-on-primary']) return;
      const primary = (own['--color-primary'] ?? '').replace(/var\(--hue-primary,\s*([\d.]+)\)/, '$1');
      assert.match(primary, /^oklch\(/, `${rel}: set --color-primary beside --color-text-on-primary so the pair can be checked`);
      checked++;
      const ratio = contrast(own['--color-text-on-primary'], primary);
      if (ratio < 4.5) low.push(`${rel} ${rule.selector.split(',')[0]}: ${ratio.toFixed(2)}`);
    });
  }
  assert.ok(checked >= 4, `only ${checked} theme overrides checked`);
  assert.deepEqual(low, []);
});

test('dark mode overrides every shadow that shadows.css declares', () => {
  const base = [];
  parse('src/tokens/shadows.css').walkDecls(/^--shadow-/, (d) => {
    // Aliases follow their target; --shadow-none has no colour to darken.
    const rule = /** @type {any} */ (d.parent);
    if (rule.selector === ':root' && /oklch\(/.test(d.value)) base.push(d.prop);
  });
  assert.ok(base.includes('--shadow-2xl') && base.includes('--shadow-inner'));

  const blocks = { attribute: new Set(), system: new Set() };
  parse('src/tokens/colors.css').walkDecls(/^--shadow-/, (d) => {
    const rule = /** @type {any} */ (d.parent);
    const inMedia = rule.parent.type === 'atrule' && /prefers-color-scheme: dark/.test(rule.parent.params);
    if (inMedia) blocks.system.add(d.prop);
    else if (rule.selector.includes('[data-mode="dark"]')) blocks.attribute.add(d.prop);
  });
  for (const [name, set] of Object.entries(blocks)) {
    assert.deepEqual(base.filter((p) => !set.has(p)), [], `${name} dark block`);
  }
});
