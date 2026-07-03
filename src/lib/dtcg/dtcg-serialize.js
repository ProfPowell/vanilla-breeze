/**
 * DTCG (Design Tokens Community Group) serializer for VB token entries.
 *
 * Pure function over `Array<[name, value]>` where each entry is a CSS
 * custom-property name + its declared value. Returns a stable-2025.10
 * shaped DTCG object suitable for JSON.stringify.
 *
 * Used by <theme-export format="dtcg">. No DOM, no I/O — round-trip
 * fidelity for VB-specific syntax (relative-color, light-dark()) is
 * preserved under $extensions["com.vanilla-breeze"].
 *
 * Spec: https://www.designtokens.org/ (stable v1, 2025-10-28)
 */

const VB_NS = 'com.vanilla-breeze';
const SPEC = '2025.10';

/**
 * @typedef {[string, string]} Entry
 * @typedef {{
 *   vbVersion?: string,
 * }} SerializeOptions
 */

/**
 * @param {Entry[]} entries
 * @param {SerializeOptions} [options]
 */
export function serializeDTCG(entries, options = {}) {
  /** @type {Record<string, any>} */
  const root = {};
  const unmapped = [];
  let seedDerivation = false;

  for (const [name, rawValue] of entries) {
    const value = String(rawValue).trim();
    const target = mapPrefix(name);
    if (!target) {
      unmapped.push(name);
      continue;
    }
    if (target.path[0] === 'color' && target.path[1] === 'seeds') {
      seedDerivation = true;
    }
    const token = buildToken(name, value, target);
    insertAt(root, target.path, target.name, token);
  }

  /** @type {Record<string, any>} */
  const meta = { spec: SPEC };
  if (options.vbVersion) meta.vbVersion = options.vbVersion;
  if (seedDerivation) meta.seedDerivation = true;
  if (unmapped.length) meta.unmapped = unmapped;
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

/**
 * @param {string} _name
 * @param {string} value
 * @param {Target} target
 */
function buildToken(_name, value, target) {
  switch (target.type) {
    case 'color':       return buildColorToken(value);
    case 'fontFamily':  return { $type: 'fontFamily', $value: parseFontFamily(value) };
    case 'fontWeight':  return { $type: 'fontWeight', $value: parseNumber(value) };
    case 'number':      return buildNumberToken(value);
    case 'dimension':   return buildDimensionToken(value);
    case 'duration':    return { $type: 'duration', $value: parseDuration(value) };
    case 'cubicBezier': return buildCubicBezierToken(value);
    case 'shadow':      return buildShadowToken(value);
    default:            return { $value: value };
  }
}

/* ---------- color ---------- */

function buildColorToken(value) {
  // light-dark(a, b) → variant triplet per stable spec.
  const ld = parseLightDark(value);
  if (ld) {
    return {
      $root: { $type: 'color', $value: parseColorValue(ld.light) ?? opaque(ld.light) },
      light: { $type: 'color', $value: parseColorValue(ld.light) ?? opaque(ld.light) },
      dark:  { $type: 'color', $value: parseColorValue(ld.dark)  ?? opaque(ld.dark)  },
      $extensions: { [VB_NS]: { lightDark: value } },
    };
  }
  // oklch(from …) and other relative-color expressions are opaque.
  if (/\bfrom\b/.test(value) && /^oklch\(/i.test(value)) {
    return {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 0, 0] },
      $extensions: { [VB_NS]: { expression: value } },
    };
  }
  const parsed = parseColorValue(value);
  if (parsed) return { $type: 'color', $value: parsed };
  return { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0] }, $extensions: { [VB_NS]: { literal: value } } };
}

function opaque(value) {
  return { colorSpace: 'srgb', components: [0, 0, 0], $vbLiteral: value };
}

/**
 * Parse a single color literal into DTCG color $value, or null if unrecognized.
 * Recognizes: oklch(L C H [/ A]), #rgb, #rrggbb, rgb(r,g,b), rgba(r,g,b,a).
 */
function parseColorValue(raw) {
  const value = String(raw).trim();
  // OKLCH
  let m = value.match(/^oklch\(\s*([^)]+)\)\s*$/i);
  if (m) {
    const [comps, alpha] = splitAlpha(m[1]);
    const parts = comps.trim().split(/\s+/);
    if (parts.length < 3) return null;
    const L = parsePercentOrNumber(parts[0]);
    const C = parseNumber(parts[1]);
    const H = parseNumber(parts[2]);
    if ([L, C, H].some(Number.isNaN)) return null;
    /** @type {Record<string, any>} */
    const out = {
      colorSpace: 'oklch',
      // OKLCH lightness is 0–1; VB writes 55%.
      components: [normalizeLightness(parts[0], L), C, H],
    };
    if (alpha != null) out.alpha = alpha;
    return out;
  }
  // hex
  m = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    const hex = m[1];
    let r, g, b, a;
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16) / 255;
      g = parseInt(hex[1] + hex[1], 16) / 255;
      b = parseInt(hex[2] + hex[2], 16) / 255;
      if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
    } else {
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    /** @type {Record<string, any>} */
    const out = {
      colorSpace: 'srgb',
      components: [r, g, b],
      hex: '#' + (hex.length <= 4 ? hex.slice(0, 3).split('').map(c => c + c).join('') : hex.slice(0, 6)).toLowerCase(),
    };
    if (a != null) out.alpha = a;
    return out;
  }
  // rgb()/rgba()
  m = value.match(/^rgba?\(\s*([^)]+)\)\s*$/i);
  if (m) {
    const parts = m[1].split(/\s*,\s*|\s+/).filter(Boolean);
    if (parts.length < 3) return null;
    const r = parseRGBChannel(parts[0]);
    const g = parseRGBChannel(parts[1]);
    const b = parseRGBChannel(parts[2]);
    /** @type {Record<string, any>} */
    const out = { colorSpace: 'srgb', components: [r, g, b] };
    if (parts[3] != null) out.alpha = parsePercentOrNumber(parts[3]);
    return out;
  }
  return null;
}

function normalizeLightness(raw, parsed) {
  // OKLCH lightness comes in two flavors: "55%" → 0.55, "0.55" → 0.55.
  if (typeof raw === 'string' && raw.endsWith('%')) return parsed / 100;
  return parsed;
}

function splitAlpha(inner) {
  const idx = inner.indexOf('/');
  if (idx < 0) return [inner, null];
  const comps = inner.slice(0, idx);
  const alpha = parsePercentOrNumber(inner.slice(idx + 1).trim());
  return [comps, alpha];
}

function parseRGBChannel(s) {
  const v = s.trim();
  if (v.endsWith('%')) return parseFloat(v) / 100;
  return parseFloat(v) / 255;
}

/* ---------- number / dimension ---------- */

function buildNumberToken(value) {
  const n = parsePercentOrNumber(value);
  /** @type {Record<string, any>} */
  const tok = { $type: 'number', $value: n };
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    tok.$extensions = { [VB_NS]: { unit: '%' } };
  }
  return tok;
}

function buildDimensionToken(value) {
  const v = String(value).trim();
  const m = v.match(/^(-?[\d.]+)(px|rem|em|%)?$/);
  if (!m) return { $type: 'dimension', $value: { value: 0, unit: 'px' }, $extensions: { [VB_NS]: { literal: v } } };
  const n = parseFloat(m[1]);
  const unit = m[2] || 'px';
  // DTCG only specs px and rem; em / % go through with an extension hint.
  const dtcgUnit = (unit === 'px' || unit === 'rem') ? unit : 'rem';
  /** @type {Record<string, any>} */
  const tok = { $type: 'dimension', $value: { value: n, unit: dtcgUnit } };
  if (unit !== 'px' && unit !== 'rem') {
    tok.$extensions = { [VB_NS]: { unit } };
  }
  return tok;
}

function parseNumber(value) { return parseFloat(String(value).trim()); }
function parsePercentOrNumber(value) {
  const v = String(value).trim();
  if (v.endsWith('%')) return parseFloat(v);
  return parseFloat(v);
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

/* ---------- duration / cubic-bezier ---------- */

function parseDuration(value) {
  const v = String(value).trim();
  let m = v.match(/^(-?[\d.]+)(ms|s)$/);
  if (m) return { value: parseFloat(m[1]), unit: m[2] };
  return { value: parseFloat(v), unit: 'ms' };
}

function buildCubicBezierToken(value) {
  const m = String(value).match(/^cubic-bezier\(\s*([^)]+)\)\s*$/i);
  if (!m) return { $type: 'cubicBezier', $value: [0, 0, 1, 1], $extensions: { [VB_NS]: { literal: value } } };
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return { $type: 'cubicBezier', $value: [0, 0, 1, 1], $extensions: { [VB_NS]: { literal: value } } };
  }
  return { $type: 'cubicBezier', $value: parts };
}

/* ---------- shadow ---------- */

function buildShadowToken(value) {
  const stops = splitTopLevelCommas(String(value));
  const parsed = stops.map(parseShadowStop);
  if (parsed.some(p => p == null)) {
    return { $type: 'shadow', $value: { offsetX: { value: 0, unit: 'px' }, offsetY: { value: 0, unit: 'px' }, blur: { value: 0, unit: 'px' }, color: { colorSpace: 'srgb', components: [0, 0, 0] } }, $extensions: { [VB_NS]: { literal: value } } };
  }
  if (parsed.length === 1) return { $type: 'shadow', $value: parsed[0] };
  return { $type: 'shadow', $value: parsed };
}

/**
 * Parse a single shadow stop "offsetX offsetY blur [spread] color" → DTCG shadow object.
 * Returns null if the stop can't be parsed (color must be present).
 */
function parseShadowStop(raw) {
  const s = raw.trim();
  // Pull out the color first — it can be hex, rgb(), rgba(), or oklch().
  const colorMatch = s.match(/(#[0-9a-f]{3,8}|rgba?\([^)]+\)|oklch\([^)]+\))$/i);
  if (!colorMatch) return null;
  const color = parseColorValue(colorMatch[0]);
  if (!color) return null;
  const dimsRaw = s.slice(0, colorMatch.index).trim();
  const dims = dimsRaw.split(/\s+/).filter(Boolean);
  if (dims.length < 3) return null;
  const dim = (i) => parseDimensionPart(dims[i]);
  /** @type {Record<string, any>} */
  const out = {
    offsetX: dim(0),
    offsetY: dim(1),
    blur:    dim(2),
    color,
  };
  if (dims[3]) out.spread = dim(3);
  return out;
}

function parseDimensionPart(part) {
  const m = part.match(/^(-?[\d.]+)(px|rem|em)?$/);
  if (!m) return { value: 0, unit: 'px' };
  const n = parseFloat(m[1]);
  const unit = m[2] || 'px';
  const dtcgUnit = (unit === 'px' || unit === 'rem') ? unit : 'rem';
  return { value: n, unit: dtcgUnit };
}

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

/* ---------- light-dark ---------- */

function parseLightDark(value) {
  const m = String(value).match(/^light-dark\(\s*([\s\S]+)\s*\)\s*$/i);
  if (!m) return null;
  const parts = splitTopLevelCommas(m[1]);
  if (parts.length !== 2) return null;
  return { light: parts[0].trim(), dark: parts[1].trim() };
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
