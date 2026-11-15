/**
 * DTCG (Design Tokens Community Group) serializer for VB token entries.
 *
 * Pure function over `Array<[name, value]>` where each entry is a CSS
 * custom-property name + its declared value. Returns a stable-2025.10
 * shaped DTCG object suitable for JSON.stringify.
 *
 * Used by <theme-export format="dtcg"> and the theme build. No DOM, no I/O.
 *
 * Every `$value` is a real value. CSS that is not a finished value is
 * resolved against the other entries: `var()` of a token in the set becomes
 * a DTCG alias, and relative colors, `color-mix()`, `calc()`, named colors
 * and easing keywords are computed. The CSS text is kept under
 * `$extensions["com.vanilla-breeze"]` (`expression`, `lightDark` or
 * `literal`) so re-import is exact. A value that cannot be computed
 * statically is left out of the token tree and listed with its CSS text
 * under the root `$extensions["com.vanilla-breeze"].cssOnly`: the format
 * has no string type, and a stand-in would be read as the real value.
 *
 * Spec: https://www.designtokens.org/ (stable v1, 2025-10-28)
 */

const VB_NS = 'com.vanilla-breeze';
const SPEC = '2025.10';

/**
 * @typedef {[string, string]} Entry
 * @typedef {{
 *   vbVersion?: string,
 *   context?: Entry[],
 * }} SerializeOptions
 */

/**
 * @param {Entry[]} entries
 * @param {SerializeOptions} [options] `context` holds entries that `var()`
 *   may be resolved against but that are not written to the file (the base
 *   theme, when serializing its dark overrides).
 * @returns {Record<string, any>} DTCG token tree with VB metadata under `$extensions`.
 */
export function serializeDTCG(entries, options = {}) {
  /** @type {Record<string, any>} */
  const root = {};
  const unmapped = [];
  /** @type {Record<string, string>} */
  const cssOnly = {};
  let seedDerivation = false;

  const own = new Map(entries.map(([n, v]) => [n, String(v).trim()]));
  const build = createBuilder(own, new Map((options.context || []).map(([n, v]) => [n, String(v).trim()])));

  for (const name of own.keys()) {
    const target = mapPrefix(name);
    if (!target) {
      unmapped.push(name);
      continue;
    }
    if (target.path[0] === 'color' && target.path[1] === 'seeds') {
      seedDerivation = true;
    }
    const token = build(name);
    if (token) insertAt(root, target.path, target.name, token);
    else cssOnly[name] = /** @type {string} */ (own.get(name));
  }

  /** @type {Record<string, any>} */
  const meta = { spec: SPEC };
  if (options.vbVersion) meta.vbVersion = options.vbVersion;
  if (seedDerivation) meta.seedDerivation = true;
  if (unmapped.length) meta.unmapped = unmapped;
  if (Object.keys(cssOnly).length) meta.cssOnly = cssOnly;
  root.$extensions = { [VB_NS]: meta };

  return root;
}

/* ---------- prefix → group/type routing ---------- */

/**
 * @typedef {{ path: string[], type: string, name: string }} Target
 */

/**
 * Return the DTCG group path + type for a VB CSS custom-property name.
 * Order matters — more specific prefixes must come before broader ones.
 *
 * @param {string} name
 * @returns {Target | null}
 */
function mapPrefix(name) {
  const prefixes = [
    // color seeds (must precede --color-)
    { p: '--hue-',           path: ['color', 'seeds'], type: 'number',     keep: true },
    { p: '--lightness-',     path: ['color', 'seeds'], type: 'number',     keep: true },
    { p: '--chroma-',        path: ['color', 'seeds'], type: 'number',     keep: true },
    // color
    { p: '--color-',         path: ['color'],          type: 'color' },
    // typography
    { p: '--font-size-',     path: ['typography', 'size'],          type: 'dimension' },
    { p: '--font-weight-',   path: ['typography', 'weight'],        type: 'fontWeight' },
    { p: '--font-',          path: ['typography', 'family'],        type: 'fontFamily' },
    { p: '--line-height-',   path: ['typography', 'lineHeight'],    type: 'number' },
    { p: '--letter-spacing-',path: ['typography', 'letterSpacing'], type: 'dimension' },
    // spacing
    { p: '--size-',          path: ['spacing'],        type: 'dimension' },
    // border
    { p: '--radius-',        path: ['border', 'radius'], type: 'dimension' },
    { p: '--border-width-',  path: ['border', 'width'],  type: 'dimension' },
    // motion
    { p: '--duration-',      path: ['motion', 'duration'], type: 'duration' },
    { p: '--ease-',          path: ['motion', 'easing'],   type: 'cubicBezier' },
    // effect
    { p: '--shadow-',        path: ['effect', 'shadow'], type: 'shadow' },
  ];
  for (const { p, path, type, keep } of prefixes) {
    if (name.startsWith(p)) {
      // For seeds we keep the full prefix-stripped name (hue-primary, lightness-primary)
      // so consumers can disambiguate without re-parsing.
      const tail = keep ? name.slice(2) : name.slice(p.length);
      return { path, type, name: tail };
    }
  }
  return null;
}

/* ---------- token builders ---------- */

// CSS easing keywords as the cubic-bezier() curves the CSS spec defines.
const EASING = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
};

const COLOR_FUNCTION_SPACES = new Set([
  'srgb', 'srgb-linear', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'xyz-d65', 'xyz-d50',
]);

// CSS named colors → hex.
const NAMED_COLORS = Object.fromEntries((
  'aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,azure:f0ffff,beige:f5f5dc,bisque:ffe4c4,' +
  'black:000000,blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,burlywood:deb887,cadetblue:5f9ea0,' +
  'chartreuse:7fff00,chocolate:d2691e,coral:ff7f50,cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,cyan:00ffff,' +
  'darkblue:00008b,darkcyan:008b8b,darkgoldenrod:b8860b,darkgray:a9a9a9,darkgreen:006400,darkgrey:a9a9a9,' +
  'darkkhaki:bdb76b,darkmagenta:8b008b,darkolivegreen:556b2f,darkorange:ff8c00,darkorchid:9932cc,darkred:8b0000,' +
  'darksalmon:e9967a,darkseagreen:8fbc8f,darkslateblue:483d8b,darkslategray:2f4f4f,darkslategrey:2f4f4f,' +
  'darkturquoise:00ced1,darkviolet:9400d3,deeppink:ff1493,deepskyblue:00bfff,dimgray:696969,dimgrey:696969,' +
  'dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,forestgreen:228b22,fuchsia:ff00ff,gainsboro:dcdcdc,' +
  'ghostwhite:f8f8ff,gold:ffd700,goldenrod:daa520,gray:808080,green:008000,greenyellow:adff2f,grey:808080,' +
  'honeydew:f0fff0,hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,khaki:f0e68c,lavender:e6e6fa,' +
  'lavenderblush:fff0f5,lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,lightcoral:f08080,lightcyan:e0ffff,' +
  'lightgoldenrodyellow:fafad2,lightgray:d3d3d3,lightgreen:90ee90,lightgrey:d3d3d3,lightpink:ffb6c1,' +
  'lightsalmon:ffa07a,lightseagreen:20b2aa,lightskyblue:87cefa,lightslategray:778899,lightslategrey:778899,' +
  'lightsteelblue:b0c4de,lightyellow:ffffe0,lime:00ff00,limegreen:32cd32,linen:faf0e6,magenta:ff00ff,maroon:800000,' +
  'mediumaquamarine:66cdaa,mediumblue:0000cd,mediumorchid:ba55d3,mediumpurple:9370db,mediumseagreen:3cb371,' +
  'mediumslateblue:7b68ee,mediumspringgreen:00fa9a,mediumturquoise:48d1cc,mediumvioletred:c71585,' +
  'midnightblue:191970,mintcream:f5fffa,mistyrose:ffe4e1,moccasin:ffe4b5,navajowhite:ffdead,navy:000080,' +
  'oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,orangered:ff4500,orchid:da70d6,palegoldenrod:eee8aa,' +
  'palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f,' +
  'pink:ffc0cb,plum:dda0dd,powderblue:b0e0e6,purple:800080,rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,' +
  'royalblue:4169e1,saddlebrown:8b4513,salmon:fa8072,sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,' +
  'sienna:a0522d,silver:c0c0c0,skyblue:87ceeb,slateblue:6a5acd,slategray:708090,slategrey:708090,snow:fffafa,' +
  'springgreen:00ff7f,steelblue:4682b4,tan:d2b48c,teal:008080,thistle:d8bfd8,tomato:ff6347,turquoise:40e0d0,' +
  'violet:ee82ee,wheat:f5deb3,white:ffffff,whitesmoke:f5f5f5,yellow:ffff00,yellowgreen:9acd32'
).split(',').map((pair) => pair.split(':')));

/**
 * @typedef {{ space: string, c: number[], alpha?: number, hex?: string }} Color
 * @typedef {{ n: number, unit: string }} Quantity
 */

/**
 * Token builder over one set of entries. `own` is the set being written;
 * `context` is only read when resolving `var()`.
 *
 * @param {Map<string, string>} own
 * @param {Map<string, string>} context
 * @returns {(name: string) => Record<string, any> | null} null = cannot be
 *   expressed as a DTCG value.
 */
function createBuilder(own, context) {
  /** @type {Map<string, Record<string, any> | null>} */
  const built = new Map();
  const building = new Set();
  // False once the value in hand is no longer what a plain re-render of
  // `$value` would give back; the CSS text is then kept in $extensions.
  let exact = true;

  function build(name) {
    if (built.has(name)) return built.get(name) ?? null;
    if (building.has(name)) return null; // reference cycle
    building.add(name);
    const token = buildToken(name);
    building.delete(name);
    built.set(name, token);
    return token;
  }

  function buildToken(name) {
    const source = /** @type {string} */ (own.get(name));
    const target = /** @type {Target} */ (mapPrefix(name));

    // A lone var() reference, whose target is a token of the same kind in this file,
    // is a DTCG alias.
    const ref = source.match(/^var\(\s*(--[\w-]+)\s*\)$/);
    if (ref && own.has(ref[1])) {
      const to = mapPrefix(ref[1]);
      const tok = to && to.type === target.type ? build(ref[1]) : null;
      if (to && tok && '$value' in tok) {
        return { $type: tok.$type, $value: `{${[...to.path, to.name].join('.')}}` };
      }
    }

    exact = true;
    const text = substituteVars(source, new Set([name]));
    if (text == null || text === '') return null;
    if (text !== source) exact = false;

    /** @type {Record<string, any> | null} */
    const token = target.type === 'color' ? colorToken(text) : scalarToken(text, target.type);
    if (!token) return null;

    const key = token.$root ? 'lightDark'
      : exact ? null
      : /\(\s*from\s/i.test(source) ? 'expression' : 'literal';
    if (key) {
      token.$extensions = { [VB_NS]: { ...token.$extensions?.[VB_NS], [key]: source } };
    }
    return token;
  }

  /**
   * Replace every var() with the text it refers to, or null when a
   * reference has no value in the set and no fallback.
   *
   * @param {string} text
   * @param {Set<string>} seen
   * @returns {string | null}
   */
  function substituteVars(text, seen) {
    let out = '';
    let i = 0;
    for (;;) {
      const at = text.indexOf('var(', i);
      if (at === -1) return out + text.slice(i);
      const end = closeParen(text, at + 3);
      if (end === -1) return null;
      const inner = text.slice(at + 4, end);
      const comma = topLevelIndex(inner, ',');
      const ref = (comma === -1 ? inner : inner.slice(0, comma)).trim();
      const raw = own.get(ref) ?? context.get(ref);
      let value = raw != null && !seen.has(ref)
        ? substituteVars(raw, new Set(seen).add(ref))
        : null;
      if (value == null && comma !== -1) value = substituteVars(inner.slice(comma + 1).trim(), seen);
      if (value == null) return null;
      out += text.slice(i, at) + value;
      i = end + 1;
    }
  }

  /* ---------- numbers ---------- */

  /**
   * A number with its unit, from a literal or a calc() that can be worked
   * out. `env` supplies channel keywords inside relative colors.
   *
   * @param {string} raw
   * @param {Record<string, number>} [env]
   * @returns {Quantity | null}
   */
  function numeric(raw, env) {
    const t = raw.trim();
    const m = t.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%|[a-z]+)?$/i);
    if (m) return { n: parseFloat(m[1]), unit: (m[2] || '').toLowerCase() };
    if (env && Object.hasOwn(env, t.toLowerCase())) {
      exact = false;
      return { n: env[t.toLowerCase()], unit: '' };
    }
    if (/^calc\(/i.test(t) && closeParen(t, 4) === t.length - 1) {
      exact = false;
      const q = evalCalc(t.slice(5, -1), env);
      return q && Number.isFinite(q.n) ? { n: round(q.n), unit: q.unit } : null;
    }
    return null;
  }

  /** Channel value: a percentage is taken of `ref`; any other unit fails. */
  function channel(raw, ref, env) {
    if (raw == null) return NaN;
    if (/^none$/i.test(raw.trim())) { exact = false; return 0; }
    const q = numeric(raw, env);
    if (!q) return NaN;
    if (q.unit === '%') return q.n * ref / 100;
    return q.unit === '' ? q.n : NaN;
  }

  function hue(raw, env) {
    if (raw == null) return NaN;
    if (/^none$/i.test(raw.trim())) { exact = false; return 0; }
    const q = numeric(raw, env);
    if (!q) return NaN;
    if (q.unit === '' || q.unit === 'deg') return q.n;
    if (q.unit === 'turn') return q.n * 360;
    if (q.unit === 'grad') return q.n * 0.9;
    if (q.unit === 'rad') return q.n * 180 / Math.PI;
    return NaN;
  }

  /* ---------- color ---------- */

  function colorToken(text) {
    // light-dark(), at any depth once var() is resolved → variant triplet.
    if (/light-dark\(/i.test(text)) {
      const light = colorValue(pickLightDark(text, 0));
      const dark = colorValue(pickLightDark(text, 1));
      if (!light || !dark) return null;
      return {
        $root: { $type: 'color', $value: light },
        light: { $type: 'color', $value: light },
        dark:  { $type: 'color', $value: dark },
      };
    }
    const value = colorValue(text);
    return value ? { $type: 'color', $value: value } : null;
  }

  /** CSS color text → DTCG color $value, or null. */
  function colorValue(text) {
    const color = parseColor(text);
    if (!color || color.c.some((n) => !Number.isFinite(n))) return null;
    if (color.alpha != null && !Number.isFinite(color.alpha)) return null;
    /** @type {Record<string, any>} */
    const out = { colorSpace: color.space, components: color.c };
    if (color.hex) out.hex = color.hex;
    if (color.alpha != null) out.alpha = color.alpha;
    return out;
  }

  /**
   * @param {string} raw
   * @returns {Color | null}
   */
  function parseColor(raw) {
    const value = String(raw).trim();
    const lower = value.toLowerCase();

    const hexMatch = lower.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
    if (hexMatch) return fromHex(hexMatch[1]);
    if (lower === 'transparent') { exact = false; return { space: 'srgb', c: [0, 0, 0], alpha: 0 }; }
    if (Object.hasOwn(NAMED_COLORS, lower)) { exact = false; return fromHex(NAMED_COLORS[lower]); }

    const open = value.indexOf('(');
    if (open < 1 || closeParen(value, open) !== value.length - 1) return null;
    const fn = lower.slice(0, open);
    const inner = value.slice(open + 1, -1).trim();

    if (fn === 'color-mix') return mixColors(inner);
    if (/^from\s/i.test(inner)) return fn === 'oklch' ? relativeOklch(inner) : null;

    const slash = topLevelIndex(inner, '/');
    const main = slash === -1 ? inner : inner.slice(0, slash);
    let alphaText = slash === -1 ? null : inner.slice(slash + 1);
    const parts = main.includes(',') ? splitTopLevelCommas(main).map((p) => p.trim()) : splitSpaces(main);
    if (fn === 'color') {
      const space = (parts.shift() || '').toLowerCase().replace(/^xyz$/, 'xyz-d65');
      if (!COLOR_FUNCTION_SPACES.has(space) || parts.length !== 3) return null;
      exact = false;
      return withAlpha({ space, c: parts.map((p) => channel(p, 1)) }, alphaText);
    }
    if (parts.length === 4 && alphaText == null) alphaText = /** @type {string} */ (parts.pop());
    if (parts.length !== 3) return null;

    switch (fn) {
      case 'oklch':
        return withAlpha({ space: 'oklch', c: [channel(parts[0], 1), channel(parts[1], 0.4), hue(parts[2])] }, alphaText);
      case 'oklab':
        exact = false;
        return withAlpha({ space: 'oklab', c: [channel(parts[0], 1), channel(parts[1], 0.4), channel(parts[2], 0.4)] }, alphaText);
      case 'rgb':
      case 'rgba':
        return withAlpha({ space: 'srgb', c: parts.map((p) => channel(p, 255) / 255) }, alphaText);
      case 'hsl':
      case 'hsla':
        exact = false;
        return withAlpha({
          space: 'srgb',
          c: hslToSrgb(hue(parts[0]), channel(parts[1], 100) / 100, channel(parts[2], 100) / 100).map(round),
        }, alphaText);
      default:
        return null;
    }
  }

  function withAlpha(color, alphaText) {
    if (alphaText != null) color.alpha = channel(alphaText, 1);
    return color;
  }

  /** oklch(from <color> L C H [/ A]) with l, c, h and alpha in scope. */
  function relativeOklch(inner) {
    exact = false;
    const rest = inner.replace(/^from\s+/i, '');
    const originText = splitSpaces(rest)[0];
    if (!originText) return null;
    const origin = toSpace(parseColor(originText), 'oklch');
    if (!origin) return null;
    const spec = rest.slice(rest.indexOf(originText) + originText.length);
    const slash = topLevelIndex(spec, '/');
    const parts = splitSpaces(slash === -1 ? spec : spec.slice(0, slash));
    if (parts.length !== 3) return null;
    const env = { l: origin.c[0], c: origin.c[1], h: origin.c[2], alpha: origin.alpha ?? 1 };
    const alpha = slash === -1 ? env.alpha : channel(spec.slice(slash + 1), 1, env);
    return finish('oklch', [channel(parts[0], 1, env), channel(parts[1], 0.4, env), hue(parts[2], env)], alpha);
  }

  /** color-mix(in srgb | oklab | oklch, <color> [p%], <color> [p%]). */
  function mixColors(inner) {
    exact = false;
    const args = splitTopLevelCommas(inner).map((a) => a.trim());
    const method = (args[0] || '').toLowerCase().match(/^in\s+(srgb|oklab|oklch)(\s+shorter\s+hue)?$/);
    if (args.length !== 3 || !method) return null;
    const space = method[1];
    const sides = args.slice(1).map((arg) => {
      const tokens = splitSpaces(arg);
      const at = tokens.findIndex((t) => /^[\d.]+%$/.test(t));
      const pct = at === -1 ? null : parseFloat(tokens.splice(at, 1)[0]);
      return { pct, color: toSpace(parseColor(tokens.join(' ')), space) };
    });
    const [a, b] = sides;
    if (!a.color || !b.color) return null;
    let pa = a.pct ?? (b.pct == null ? 50 : 100 - b.pct);
    let pb = b.pct ?? 100 - pa;
    const sum = pa + pb;
    if (!(sum > 0)) return null;
    pa /= sum; pb /= sum;

    const ca = [...a.color.c];
    const cb = [...b.color.c];
    const wa = (a.color.alpha ?? 1) * pa;
    const wb = (b.color.alpha ?? 1) * pb;
    const alpha = wa + wb;
    if (space === 'oklch') {
      // A gray has no hue of its own; take the other color's.
      if (ca[1] < 1e-4) ca[2] = cb[2];
      if (cb[1] < 1e-4) cb[2] = ca[2];
      let delta = cb[2] - ca[2];
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      cb[2] = ca[2] + delta;
    }
    const c = ca.map((n, i) => {
      if (space === 'oklch' && i === 2) return (((n * pa + cb[i] * pb) % 360) + 360) % 360;
      return alpha ? (n * wa + cb[i] * wb) / alpha : 0;
    });
    return finish(space, c, alpha * Math.min(sum / 100, 1));
  }

  /* ---------- everything that is not a color ---------- */

  function scalarToken(text, type) {
    switch (type) {
      case 'fontFamily': {
        const families = parseFontFamily(text);
        return families.length ? { $type: 'fontFamily', $value: families } : null;
      }
      case 'cubicBezier': return cubicBezierToken(text);
      case 'shadow':      return shadowToken(text);
      default:            return numberToken(text, type);
    }
  }

  function numberToken(text, type) {
    // The two CSS font-weight keywords are also DTCG fontWeight names.
    if (type === 'fontWeight' && /^(normal|bold)$/i.test(text)) {
      return { $type: 'fontWeight', $value: text.toLowerCase() };
    }
    const q = numeric(text);
    if (!q) return null;
    if (type === 'duration') {
      if (q.unit !== '' && q.unit !== 'ms' && q.unit !== 's') return null;
      return { $type: 'duration', $value: { value: q.n, unit: q.unit || 'ms' } };
    }
    if (type === 'fontWeight') {
      return q.unit === '' ? { $type: 'fontWeight', $value: q.n } : null;
    }
    if (type === 'dimension') {
      const length = dtcgLength(q);
      if (length) return { $type: 'dimension', $value: length };
    }
    // A plain number, or a length in a unit DTCG dimensions do not have
    // (they allow px and rem only). The number is written as a number and
    // the unit kept beside it, so no tool reads it as px or rem.
    /** @type {Record<string, any>} */
    const tok = { $type: 'number', $value: q.n };
    if (q.unit) tok.$extensions = { [VB_NS]: { unit: q.unit } };
    return tok;
  }

  /** px, rem and a bare 0 are the lengths a DTCG dimension can hold. */
  function dtcgLength(q) {
    if (q.unit === 'px' || q.unit === 'rem') return { value: q.n, unit: q.unit };
    if (q.unit === '' && q.n === 0) return { value: 0, unit: 'px' };
    return null;
  }

  function cubicBezierToken(text) {
    const keyword = text.toLowerCase();
    if (Object.hasOwn(EASING, keyword)) {
      exact = false;
      return { $type: 'cubicBezier', $value: [...EASING[keyword]] };
    }
    const m = text.match(/^cubic-bezier\(([^()]*)\)$/i);
    if (!m) return null;
    const parts = m[1].split(',').map((p) => numeric(p));
    if (parts.length !== 4 || parts.some((q) => !q || q.unit !== '')) return null;
    return { $type: 'cubicBezier', $value: parts.map((q) => /** @type {Quantity} */ (q).n) };
  }

  function shadowToken(text) {
    if (/^none$/i.test(text)) {
      // No shadow is a shadow with no size and a fully transparent color.
      exact = false;
      const zero = { value: 0, unit: 'px' };
      return {
        $type: 'shadow',
        $value: { offsetX: zero, offsetY: zero, blur: zero, color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0 } },
      };
    }
    const stops = splitTopLevelCommas(text).map(shadowStop);
    if (!stops.length || stops.some((s) => s == null)) return null;
    return { $type: 'shadow', $value: stops.length === 1 ? stops[0] : stops };
  }

  /** One "[inset] offsetX offsetY [blur [spread]] color" layer, or null. */
  function shadowStop(raw) {
    const lengths = [];
    const colorParts = [];
    let inset = false;
    for (const part of splitSpaces(raw)) {
      if (/^inset$/i.test(part)) { inset = true; exact = false; continue; }
      const q = /^[-+.\d]|^calc\(/i.test(part) ? numeric(part) : null;
      if (!q) { colorParts.push(part); continue; }
      const length = dtcgLength(q);
      if (!length) return null;
      if (colorParts.length) exact = false; // color written first
      lengths.push(length);
    }
    if (lengths.length < 2 || lengths.length > 4 || !colorParts.length) return null;
    const color = colorValue(colorParts.join(' '));
    if (!color) return null;
    if (lengths.length === 2) exact = false;
    /** @type {Record<string, any>} */
    const out = {
      offsetX: lengths[0],
      offsetY: lengths[1],
      blur: lengths[2] ?? { value: 0, unit: 'px' },
      color,
    };
    if (lengths[3]) out.spread = lengths[3];
    if (inset) out.inset = true;
    return out;
  }

  return build;
}

/* ---------- calc() ---------- */

/**
 * Evaluate the inside of a calc(): + - * / and parentheses over numbers
 * with units. Returns null for anything that cannot be reduced to one
 * number in one unit (mixed units, unknown names, other functions).
 *
 * @param {string} source
 * @param {Record<string, number>} [env]
 * @returns {Quantity | null}
 */
function evalCalc(source, env) {
  const tokens = source.match(/(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:%|[a-z]+)?|[a-z]+|[-+*/()]|\S/gi) || [];
  let pos = 0;

  /** @returns {Quantity | null} */
  function sum() {
    let left = product();
    while (left && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const sign = tokens[pos++] === '+' ? 1 : -1;
      const right = product();
      if (!right || right.unit !== left.unit) return null;
      left = { n: left.n + sign * right.n, unit: left.unit };
    }
    return left;
  }

  /** @returns {Quantity | null} */
  function product() {
    let left = factor();
    while (left && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const divide = tokens[pos++] === '/';
      const right = factor();
      if (!right) return null;
      if (divide) {
        if (right.unit !== '' || right.n === 0) return null;
        left = { n: left.n / right.n, unit: left.unit };
      } else {
        if (left.unit !== '' && right.unit !== '') return null;
        left = { n: left.n * right.n, unit: left.unit || right.unit };
      }
    }
    return left;
  }

  /** @returns {Quantity | null} */
  function factor() {
    let token = tokens[pos++];
    if (token === '-' || token === '+') {
      const value = factor();
      return value && { n: token === '-' ? -value.n : value.n, unit: value.unit };
    }
    if (token && token.toLowerCase() === 'calc' && tokens[pos] === '(') token = tokens[pos++];
    if (token === '(') {
      const value = sum();
      return tokens[pos++] === ')' ? value : null;
    }
    if (token == null) return null;
    const m = token.match(/^((?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%|[a-z]+)?$/i);
    if (m) return { n: parseFloat(m[1]), unit: (m[2] || '').toLowerCase() };
    const name = token.toLowerCase();
    return env && Object.hasOwn(env, name) ? { n: env[name], unit: '' } : null;
  }

  const result = sum();
  return pos === tokens.length ? result : null;
}

/* ---------- color math ---------- */

// Computed values are rounded so float noise does not reach the file.
function round(n) { return +n.toFixed(5); }

/**
 * @param {string} space
 * @param {number[]} c
 * @param {number} alpha
 * @returns {Color}
 */
function finish(space, c, alpha) {
  /** @type {Color} */
  const out = { space, c: c.map(round) };
  if (space === 'oklch') {
    out.c[0] = Math.min(1, Math.max(0, out.c[0]));
    out.c[1] = Math.max(0, out.c[1]);
  }
  if (!(alpha >= 1)) out.alpha = Number.isNaN(alpha) ? NaN : round(Math.max(0, alpha));
  return out;
}

/** @returns {Color} */
function fromHex(hex) {
  const full = hex.length <= 4 ? hex.split('').map((ch) => ch + ch).join('') : hex;
  const byte = (i) => parseInt(full.slice(i, i + 2), 16) / 255;
  /** @type {Color} */
  const out = { space: 'srgb', c: [byte(0), byte(2), byte(4)], hex: '#' + full.slice(0, 6).toLowerCase() };
  if (full.length === 8) out.alpha = byte(6);
  return out;
}

function hslToSrgb(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

/**
 * Convert between srgb, oklab and oklch. Null for any other space.
 *
 * @param {Color | null} color
 * @param {string} space
 * @returns {Color | null}
 */
function toSpace(color, space) {
  if (!color) return null;
  if (color.space === space) return color;
  let lab;
  if (color.space === 'srgb') lab = srgbToOklab(color.c);
  else if (color.space === 'oklab') lab = color.c;
  else if (color.space === 'oklch') {
    const [L, C, H] = color.c;
    lab = [L, C * Math.cos(H * Math.PI / 180), C * Math.sin(H * Math.PI / 180)];
  } else return null;

  let c;
  if (space === 'oklab') c = lab;
  else if (space === 'srgb') c = oklabToSrgb(lab);
  else if (space === 'oklch') {
    const C = Math.hypot(lab[1], lab[2]);
    const H = C < 1e-6 ? 0 : (Math.atan2(lab[2], lab[1]) * 180 / Math.PI + 360) % 360;
    c = [lab[0], C, H];
  } else return null;
  /** @type {Color} */
  const out = { space, c };
  if (color.alpha != null) out.alpha = color.alpha;
  return out;
}

function srgbToOklab(rgb) {
  const [r, g, b] = rgb.map((v) => (Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** @param {number[]} lab */
function oklabToSrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ].map((v) => (Math.abs(v) <= 0.0031308 ? 12.92 * v : Math.sign(v) * (1.055 * Math.abs(v) ** (1 / 2.4) - 0.055)));
}

/* ---------- font family ---------- */

function parseFontFamily(value) {
  // Split on commas not inside quotes; strip surrounding quotes.
  const out = [];
  let buf = '';
  let quote = null;
  for (const ch of String(value)) {
    if (quote) {
      if (ch === quote) { quote = null; continue; }
      buf += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ',') {
      const t = buf.trim();
      if (t) out.push(t);
      buf = '';
    } else {
      buf += ch;
    }
  }
  const t = buf.trim();
  if (t) out.push(t);
  return out;
}

/* ---------- text splitting ---------- */

/**
 * Split "a, b, c" on top-level commas — does not split commas inside parens.
 */
function splitTopLevelCommas(value) {
  const out = [];
  let buf = '';
  let depth = 0;
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** Split on whitespace that is not inside parentheses. */
function splitSpaces(value) {
  const out = [];
  let buf = '';
  let depth = 0;
  for (const ch of value) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && /\s/.test(ch)) {
      if (buf) out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf) out.push(buf);
  return out;
}

/** Index of the parenthesis closing the one at `open`, or -1. */
function closeParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

/** Index of the first `ch` outside parentheses, or -1. */
function topLevelIndex(text, ch) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
    else if (text[i] === ch && depth === 0) return i;
  }
  return -1;
}

/** Replace each light-dark(a, b) with its light (0) or dark (1) side. */
function pickLightDark(text, side) {
  for (;;) {
    const at = text.search(/light-dark\(/i);
    if (at === -1) return text;
    const end = closeParen(text, at + 10);
    const parts = end === -1 ? [] : splitTopLevelCommas(text.slice(at + 11, end));
    if (parts.length !== 2) return '';
    text = text.slice(0, at) + parts[side].trim() + text.slice(end + 1);
  }
}

/* ---------- tree insertion ---------- */

/**
 * Walk `root` along `path`, creating empty groups as needed, then place
 * `token` under `name` at the leaf. Existing tokens with the same name
 * are overwritten (last write wins).
 */
function insertAt(root, path, name, token) {
  let node = root;
  for (const key of path) {
    if (!node[key] || typeof node[key] !== 'object') node[key] = {};
    node = node[key];
  }
  node[name] = token;
}
