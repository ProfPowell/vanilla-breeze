/**
 * Color conversion utilities for color-picker.
 * All functions are pure — no side effects or DOM access.
 */

/**
 * HSL (h: 0-360, s: 0-100, l: 0-100) → RGB (r,g,b: 0-255)
 *
 * @param {number} h - Hue, 0-360.
 * @param {number} s - Saturation, 0-100.
 * @param {number} l - Lightness, 0-100.
 * @returns {{ r: number, g: number, b: number }} RGB channels, 0-255.
 */
export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

/**
 * RGB (r,g,b: 0-255) → HSL (h: 0-360, s: 0-100, l: 0-100)
 *
 * @param {number} r - Red, 0-255.
 * @param {number} g - Green, 0-255.
 * @param {number} b - Blue, 0-255.
 * @param {boolean} [precise=false] - Skip rounding. The picker keeps its
 *   state unrounded so a hex → HSL → hex round trip is lossless.
 * @returns {{ h: number, s: number, l: number }} HSL components.
 */
export function rgbToHsl(r, g, b, precise = false) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  if (precise) return { h: h * 360, s: s * 100, l: l * 100 };
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Hex string → RGB
 *
 * @param {string} hex - 3- or 6-digit hex color, with or without '#'.
 * @returns {{ r: number, g: number, b: number }} RGB channels, 0-255.
 */
export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const n = parseInt(hex, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

/**
 * RGB → Hex string (with #)
 *
 * @param {number} r - Red, 0-255.
 * @param {number} g - Green, 0-255.
 * @param {number} b - Blue, 0-255.
 * @returns {string} Hex color string such as '#ff8800'.
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Hex → HSL
 *
 * @param {string} hex - 3- or 6-digit hex color, with or without '#'.
 * @param {boolean} [precise=false] - Skip rounding (see rgbToHsl).
 * @returns {{ h: number, s: number, l: number }} HSL components.
 */
export function hexToHsl(hex, precise = false) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b, precise);
}

/**
 * HSL → Hex
 *
 * @param {number} h - Hue, 0-360.
 * @param {number} s - Saturation, 0-100.
 * @param {number} l - Lightness, 0-100.
 * @returns {string} Hex color string with leading '#'.
 */
export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/**
 * Clamp a value between min and max
 *
 * @param {number} val - Value to clamp.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The clamped value.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ── OkLCH conversions ─────────────────────────────────────────────────
// Algorithm: Björn Ottosson — https://bottosson.github.io/posts/oklab/
// Pipeline: sRGB ↔ linear sRGB ↔ OkLab ↔ OkLCH

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(clamp(v, 0, 1) * 255);
}

/**
 * RGB (0-255) → OkLCH (L: 0-1, C: 0+, H: 0-360)
 *
 * @param {number} r - Red, 0-255.
 * @param {number} g - Green, 0-255.
 * @param {number} b - Blue, 0-255.
 * @returns {{ L: number, C: number, H: number }} OkLCH components.
 */
export function rgbToOklch(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bLab = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bLab * bLab);
  let H = Math.atan2(bLab, a) * 180 / Math.PI;
  if (H < 0) H += 360;

  // Achromatic colors collapse hue (atan2 noise on tiny chroma is meaningless).
  if (C < 1e-4) H = 0;

  return { L, C, H };
}

/**
 * OkLCH → RGB (0-255). Out-of-gamut colors are clamped to sRGB.
 *
 * @param {number} L - Lightness, 0-1.
 * @param {number} C - Chroma, 0+.
 * @param {number} H - Hue, 0-360.
 * @returns {{ r: number, g: number, b: number }} RGB channels, 0-255.
 */
export function oklchToRgb(L, C, H) {
  const rad = H * Math.PI / 180;
  const a = C * Math.cos(rad);
  const bLab = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bLab;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bLab;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * bLab;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return { r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb) };
}

export function hslToOklch(h, s, l) {
  const rgb = hslToRgb(h, s, l);
  return rgbToOklch(rgb.r, rgb.g, rgb.b);
}

export function oklchToHsl(L, C, H, precise = false) {
  const { r, g, b } = oklchToRgb(L, C, H);
  return rgbToHsl(r, g, b, precise);
}

// ── CSS color-string formatters ───────────────────────────────────────
// Modern CSS Color 4 syntax (space-separated, no commas, % for percents).

export function formatHex(h, s, l) {
  return hslToHex(h, s, l);
}

export function formatRgb(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return `rgb(${r} ${g} ${b})`;
}

export function formatHsl(h, s, l) {
  return `hsl(${Math.round(h)}deg ${Math.round(s)}% ${Math.round(l)}%)`;
}

export function formatOklch(h, s, l) {
  const { L, C, H } = hslToOklch(h, s, l);
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)}deg)`;
}

/**
 * Format the current HSL state as the requested CSS color string.
 * @param {'hex'|'rgb'|'hsl'|'oklch'} format
 * @param {number} h - Hue, 0-360.
 * @param {number} s - Saturation, 0-100.
 * @param {number} l - Lightness, 0-100.
 * @returns {string} CSS color string in the requested format.
 */
export function formatColor(format, h, s, l) {
  switch (format) {
    case 'rgb':   return formatRgb(h, s, l);
    case 'hsl':   return formatHsl(h, s, l);
    case 'oklch': return formatOklch(h, s, l);
    case 'hex':
    default:      return formatHex(h, s, l);
  }
}
